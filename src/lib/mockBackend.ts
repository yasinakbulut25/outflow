// In-memory mock backend — login ekranına demo bilgileri girilince devreye girer
// (api.ts → isMockSessionActive). Amaç: gerçek backend olmadan, app-review ve demo için
// gerçekçi ve KENDİ İÇİNDE TUTARLI demo verisiyle
// uygulamayı baştan sona çalıştırmak (login → harcama/gelir/taksit/düzenli → analiz).
//
// Tasarım ilkeleri:
//  - Veri DETERMİNİSTİK üretilir (seed'li PRNG). getExpenses ve getAnalytics ayrı
//    çağrılardır; aynı kaynaktan türediği için rakamlar birbirini tutar.
//  - "Base" satırlar gerçek DB satırlarını temsil eder; taksitler her gösterim ayına,
//    düzenli şablonlar her aya occurrence olarak GERÇEK ZAMANLI türetilir (backend gibi).
//  - Tarihler new Date()'e göre üretilir → uygulama ne zaman açılırsa cari dönem dolu gelir.
//  - Mutasyonlar base diziyi değiştirir (oturum boyunca kalıcı; uygulama yeniden
//    yüklenince sıfırlanır — mock için kabul edilebilir).

import { BIRIKIM_CATEGORY_ID } from "@/lib/categoryIcons";
import { generateInstallmentSchedule } from "@/lib/formatters";
import { displayAmount } from "@/lib/groupExpenses";
import type {
  AnalyticsSummary,
  AuthData,
  Category,
  Expense,
  Income,
  RecurringIncomeTemplate,
  RecurringTemplate,
  User,
} from "@/types";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

// ---------------------------------------------------------------------------
// Demo giriş bilgileri (login ekranında kullanılır)
// ---------------------------------------------------------------------------
export const MOCK_CREDENTIALS = {
  email: "demo@outflow.app",
  password: "demo1234",
};

// Mutable: profil ekranından ad/şifre değiştirilebilsin (oturum boyunca kalıcı,
// uygulama yeniden yüklenince MOCK_CREDENTIALS'a sıfırlanır — mock için kabul edilebilir).
// not const: Redux'a girince Immer nesneyi dondurur; ad değişiminde yeni nesne atarız.
let DEMO_USER: User = {
  id: 1,
  name: "Yasin Akbulut",
  email: MOCK_CREDENTIALS.email,
  hasPassword: true,
};

// Google/Apple ile giren demo kullanıcısı: uygulama içi şifresi yok → profil
// ekranında şifre değiştirme bölümü gizlenir.
const DEMO_OAUTH_USER: User = {
  id: 2,
  name: "Yasin Akbulut",
  email: "demo@gmail.com",
  hasPassword: false,
};
let mockPassword = MOCK_CREDENTIALS.password;

// Demo şifre sıfırlama: gerçek e-posta gönderilemediği için sabit bir kod kullanılır
// (app-review/demo'da test edilebilsin). OTP ekranı mock oturumda bu kodu ipucu olarak gösterir.
export const MOCK_OTP = "123456";
const MOCK_RESET_TOKEN = "mock-reset-token.outflow.demo";
let mockReset: { code: string; expires: number; attempts: number } | null = null;
// Bu token'la giriş yapılan oturum = mock oturumu. Gerçek backend JWT'leri bununla
// asla çakışmaz; bootstrap'ta token'ı görünce mock oturumu tekrar açabiliriz.
export const MOCK_TOKEN = "mock-jwt-token.outflow.demo";

// Runtime mock oturumu: demo bilgisiyle giriş yapılınca SADECE o oturum için mock
// backend'e geçilir. Böylece tek bir normal production build hem gerçek kullanıcılara
// hem app-review'a yeter (demo hesap dışındaki herkes gerçek backend'e gider).
let _mockSession = false;
export function enableMockSession() {
  _mockSession = true;
}
export function disableMockSession() {
  _mockSession = false;
}
export function isMockSessionActive() {
  return _mockSession;
}

/** Girilen bilgiler demo hesabına mı ait? (login ekranı ve register'da kullanılır) */
export function isMockCredentials(email: string, password: string) {
  return isMockEmail(email) && password === MOCK_CREDENTIALS.password;
}

/** Yalnızca e-posta demo hesabına mı ait? (şifre gerektirmeyen akışlar, örn. şifremi unuttum) */
export function isMockEmail(email: string) {
  return email.trim().toLowerCase() === MOCK_CREDENTIALS.email;
}

// ---------------------------------------------------------------------------
// Seed'li PRNG + yardımcılar (deterministik üretim için)
// ---------------------------------------------------------------------------
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const randInt = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));
const pick = <T>(rng: () => number, arr: T[]): T =>
  arr[Math.floor(rng() * arr.length)];
/** Gerçekçi tutar: belirli bir tabana yuvarla (5/10/50 TL gibi). */
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) =>
  `${y}-${pad(m)}-${pad(Math.min(d, 28))}`;
const ts = (dateStr: string) => `${dateStr}T10:30:00.000Z`;

const NOW = new Date();
const CUR_YEAR = NOW.getFullYear();
const CUR_MONTH = NOW.getMonth() + 1;
const CUR_DAY = NOW.getDate();

/** [aGeri, ileri] aralığındaki (year,month) çiftlerini cariye göre üretir. */
function monthRange(
  monthsBack: number,
  monthsForward: number,
): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  for (let off = -monthsBack; off <= monthsForward; off++) {
    const base = CUR_YEAR * 12 + (CUR_MONTH - 1) + off;
    out.push({ year: Math.floor(base / 12), month: (base % 12) + 1 });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Kategoriler (categoryIcons.ts ile birebir id/renk uyumlu)
// ---------------------------------------------------------------------------
const CATEGORIES: Category[] = [
  { id: 1, name: "Akaryakıt", icon: "fuel", color: "#EF4444" },
  { id: 2, name: "Market", icon: "shopping-cart", color: "#22C55E" },
  { id: 3, name: "Faturalar", icon: "file-text", color: "#3B82F6" },
  { id: 4, name: "Giyim", icon: "shirt", color: "#8B5CF6" },
  { id: 5, name: "Elektronik", icon: "laptop", color: "#F59E0B" },
  { id: 6, name: "Sağlık", icon: "heart-pulse", color: "#EC4899" },
  { id: 7, name: "Eğlence", icon: "clapperboard", color: "#F97316" },
  { id: 8, name: "Yeme-İçme", icon: "utensils-crossed", color: "#84CC16" },
  { id: 9, name: "Ulaşım", icon: "bus", color: "#06B6D4" },
  { id: 10, name: "Alışveriş", icon: "shopping-bag", color: "#A855F7" },
  { id: 11, name: "Eğitim", icon: "book-open", color: "#10B981" },
  { id: 12, name: "Diğer", icon: "package", color: "#6B7280" },
  { id: 13, name: "Birikim", icon: "hand-coins", color: "#d97706" },
];
const catById = (id?: number) => CATEGORIES.find((c) => c.id === id);
function withCategory<T extends { category_id?: number }>(row: T): T {
  const c = catById(row.category_id);
  return c
    ? {
        ...row,
        category_name: c.name,
        category_icon: c.icon,
        category_color: c.color,
      }
    : row;
}

// ---------------------------------------------------------------------------
// Gerçekçi içerik havuzları
// ---------------------------------------------------------------------------
const MARKET_TITLES = [
  "Haftalık market",
  "Market alışverişi",
  "Migros",
  "A101",
  "BİM",
  "CarrefourSA",
];
const MARKET_ITEMS = [
  ["Süt", 65],
  ["Ekmek", 30],
  ["Yumurta", 110],
  ["Beyaz peynir", 240],
  ["Domates", 45],
  ["Tavuk göğsü", 180],
  ["Makarna", 35],
  ["Deterjan", 320],
  ["Elma", 60],
  ["Zeytinyağı", 480],
  ["Çay", 220],
  ["Kahve", 280],
  ["Pirinç", 140],
  ["Yoğurt", 95],
  ["Tavuk", 190],
  ["Su", 90],
] as const;
const FUEL_TITLES = ["Shell", "Opet", "BP", "Petrol Ofisi", "Akaryakıt"];
const FOOD_TITLES = [
  "Öğle yemeği",
  "Akşam yemeği",
  "Kahve",
  "Starbucks",
  "Burger",
  "Pizza",
  "Kebap",
  "Cafe",
];
const CLOTHING_ITEMS = [
  "Mont",
  "Spor ayakkabı",
  "Tişört",
  "Pantolon",
  "Kazak",
  "Gömlek",
];
const HEALTH_TITLES = ["Eczane", "Diş hekimi", "Muayene", "Vitamin", "Gözlük"];
const FUN_TITLES = [
  "Sinema",
  "Konser bileti",
  "Tiyatro",
  "PlayStation oyunu",
  "Maç bileti",
];
const SHOP_TITLES = [
  "Kitap",
  "Ev tekstili",
  "Mutfak gereçleri",
  "Kozmetik",
  "Hediye",
];

// ---------------------------------------------------------------------------
// Tipler (internal mutable store)
// ---------------------------------------------------------------------------
interface DB {
  expenses: Expense[];
  incomes: Income[];
  recurring: RecurringTemplate[];
  recurringIncomes: RecurringIncomeTemplate[];
  nextExpenseId: number;
  nextIncomeId: number;
  nextRecurringId: number;
  nextRecurringIncomeId: number;
}

let _id = 100;
const id = () => ++_id;

function makeExpense(p: {
  category_id?: number;
  title: string;
  expense_date: string;
  payment_type?: "cash" | "installment";
  installment_count?: number;
  note?: string;
  items: { name: string; amount: number }[];
}): Expense {
  const eid = id();
  const total = p.items.reduce((s, it) => s + it.amount, 0);
  return withCategory({
    id: eid,
    user_id: 1,
    category_id: p.category_id,
    title: p.title,
    expense_date: p.expense_date,
    payment_type: p.payment_type ?? "cash",
    installment_count: p.installment_count,
    total_amount: total,
    note: p.note,
    items: p.items.map((it, i) => ({
      id: eid * 100 + i,
      expense_id: eid,
      ...it,
    })),
    created_at: ts(p.expense_date),
    updated_at: ts(p.expense_date),
  });
}

// ---------------------------------------------------------------------------
// Başlangıç verisini üret (deterministik)
// ---------------------------------------------------------------------------
function buildDB(): DB {
  const expenses: Expense[] = [];

  // 16 ay geri + 0 ileri: gerçekleşmiş harcamalar. (Düzenli/projeksiyon ileriyi türetir.)
  for (const { year, month } of monthRange(16, 0)) {
    const rng = makeRng(year * 100 + month);
    const isCurrent = year === CUR_YEAR && month === CUR_MONTH;
    const maxDay = isCurrent ? Math.max(1, CUR_DAY) : 28; // cari ayda geleceğe tarih atma

    // Market (2-4 kez)
    const marketCount = randInt(rng, 2, 4);
    for (let k = 0; k < marketCount; k++) {
      const itemCount = randInt(rng, 3, 6);
      const items = Array.from({ length: itemCount }, () => {
        const [name, base] = pick(
          rng,
          MARKET_ITEMS as unknown as [string, number][],
        );
        return { name, amount: roundTo(base * (0.8 + rng() * 1.6), 5) };
      });
      expenses.push(
        makeExpense({
          category_id: 2,
          title: pick(rng, MARKET_TITLES),
          expense_date: iso(year, month, randInt(rng, 1, maxDay)),
          items,
        }),
      );
    }

    // Akaryakıt (1-2 kez)
    for (let k = 0; k < randInt(rng, 1, 2); k++) {
      expenses.push(
        makeExpense({
          category_id: 1,
          title: pick(rng, FUEL_TITLES),
          expense_date: iso(year, month, randInt(rng, 1, maxDay)),
          items: [{ name: "Yakıt", amount: roundTo(1400 + rng() * 1300, 10) }],
        }),
      );
    }

    // Yeme-içme (2-4 kez)
    for (let k = 0; k < randInt(rng, 2, 4); k++) {
      const title = pick(rng, FOOD_TITLES);
      expenses.push(
        makeExpense({
          category_id: 8,
          title,
          expense_date: iso(year, month, randInt(rng, 1, maxDay)),
          items: [{ name: title, amount: roundTo(180 + rng() * 900, 5) }],
        }),
      );
    }

    // Ara sıra: giyim
    if (rng() < 0.45) {
      const name = pick(rng, CLOTHING_ITEMS);
      expenses.push(
        makeExpense({
          category_id: 4,
          title: "Giyim",
          expense_date: iso(year, month, randInt(rng, 1, maxDay)),
          items: [{ name, amount: roundTo(900 + rng() * 3200, 50) }],
        }),
      );
    }
    // Ara sıra: sağlık
    if (rng() < 0.4) {
      const title = pick(rng, HEALTH_TITLES);
      expenses.push(
        makeExpense({
          category_id: 6,
          title,
          expense_date: iso(year, month, randInt(rng, 1, maxDay)),
          items: [{ name: title, amount: roundTo(300 + rng() * 2200, 10) }],
        }),
      );
    }
    // Ara sıra: eğlence
    if (rng() < 0.5) {
      const title = pick(rng, FUN_TITLES);
      expenses.push(
        makeExpense({
          category_id: 7,
          title,
          expense_date: iso(year, month, randInt(rng, 1, maxDay)),
          items: [{ name: title, amount: roundTo(200 + rng() * 1300, 5) }],
        }),
      );
    }
    // Ara sıra: alışveriş
    if (rng() < 0.4) {
      const title = pick(rng, SHOP_TITLES);
      expenses.push(
        makeExpense({
          category_id: 10,
          title,
          expense_date: iso(year, month, randInt(rng, 1, maxDay)),
          items: [{ name: title, amount: roundTo(400 + rng() * 3000, 10) }],
        }),
      );
    }

    // Birikim (kategori 13): her ay altın + ayda bir dolar
    expenses.push(
      makeExpense({
        category_id: BIRIKIM_CATEGORY_ID,
        title: "Altın",
        expense_date: iso(year, month, randInt(rng, 1, maxDay)),
        note: `${randInt(rng, 1, 4)} gram`,
        items: [{ name: "Altın", amount: roundTo(2400 + rng() * 4800, 50) }],
      }),
    );
    if (rng() < 0.6) {
      const usd = randInt(rng, 50, 250);
      expenses.push(
        makeExpense({
          category_id: BIRIKIM_CATEGORY_ID,
          title: "Dolar",
          expense_date: iso(year, month, randInt(rng, 1, maxDay)),
          note: `${usd} $`,
          items: [{ name: "Dolar", amount: roundTo(usd * 34, 50) }],
        }),
      );
    }
  }

  // Taksitli alımlar (gerçek base satır; occurrence'ları schedule'dan türer)
  const instMonths = monthRange(16, 0);
  const monthAgo = (n: number) => instMonths[instMonths.length - 1 - n];
  const m4 = monthAgo(4);
  const m2 = monthAgo(2);
  const m1 = monthAgo(1);
  const m6 = monthAgo(6);
  expenses.push(
    makeExpense({
      category_id: 5,
      title: "MacBook Air M3",
      expense_date: iso(m4.year, m4.month, 14),
      payment_type: "installment",
      installment_count: 12,
      items: [{ name: 'MacBook Air M3 13"', amount: 48000 }],
    }),
    makeExpense({
      category_id: 5,
      title: "iPhone 15",
      expense_date: iso(m2.year, m2.month, 8),
      payment_type: "installment",
      installment_count: 12,
      items: [{ name: "iPhone 15 128GB", amount: 54000 }],
    }),
    makeExpense({
      category_id: 10,
      title: "Buzdolabı",
      expense_date: iso(m1.year, m1.month, 20),
      payment_type: "installment",
      installment_count: 6,
      items: [{ name: "No-frost buzdolabı", amount: 31800 }],
    }),
    makeExpense({
      category_id: 7,
      title: "Tatil uçak bileti",
      expense_date: iso(m6.year, m6.month, 3),
      payment_type: "installment",
      installment_count: 3,
      items: [
        { name: "Gidiş-dönüş bilet", amount: 14500 },
        { name: "Bagaj", amount: 1500 },
      ],
    }),
  );

  // Tek seferlik gelirler
  const incomes: Income[] = [];
  let incId = 0;
  const addIncome = (p: {
    title: string;
    amount: number;
    income_date: string;
    note?: string;
  }) => {
    incId++;
    incomes.push({
      id: incId,
      user_id: 1,
      title: p.title,
      amount: p.amount,
      income_date: p.income_date,
      note: p.note,
      created_at: ts(p.income_date),
      updated_at: ts(p.income_date),
    });
  };
  addIncome({
    title: "Freelance — landing page",
    amount: 18500,
    income_date: iso(m2.year, m2.month, 18),
    note: "Yan proje",
  });
  addIncome({
    title: "Performans primi",
    amount: 42000,
    income_date: iso(m4.year, m4.month, 28),
    note: "Çeyrek primi",
  });
  addIncome({
    title: "İkinci el telefon satışı",
    amount: 9000,
    income_date: iso(m1.year, m1.month, 11),
  });
  addIncome({
    title: "Freelance — mobil uygulama",
    amount: 27000,
    income_date: iso(CUR_YEAR, CUR_MONTH, Math.min(CUR_DAY, 9)),
    note: "Sözleşme 1. taksit",
  });

  // Düzenli gider şablonları (start: 18 ay önce → tüm dönemleri kapsar)
  const start = monthRange(18, 0)[0];
  const startISO = iso(start.year, start.month, 1);
  const recurring: RecurringTemplate[] = [];
  let rId = 0;
  const addRecurring = (p: {
    title: string;
    amount: number;
    day_of_month: number;
    category_id?: number;
    note?: string;
    active?: boolean;
  }) => {
    rId++;
    recurring.push(
      withCategory({
        id: rId,
        user_id: 1,
        category_id: p.category_id,
        title: p.title,
        amount: p.amount,
        day_of_month: p.day_of_month,
        start_date: startISO,
        end_date: null,
        note: p.note,
        active: p.active ?? true,
        last_generated_month: null,
        created_at: ts(startISO),
        updated_at: ts(startISO),
      }),
    );
  };
  addRecurring({
    title: "Ev kirası",
    amount: 22000,
    day_of_month: 5,
    category_id: 12,
    note: "Daire kirası",
  });
  addRecurring({
    title: "Apartman aidatı",
    amount: 1500,
    day_of_month: 3,
    category_id: 12,
  });
  addRecurring({
    title: "Elektrik faturası",
    amount: 850,
    day_of_month: 18,
    category_id: 3,
  });
  addRecurring({
    title: "Su faturası",
    amount: 320,
    day_of_month: 20,
    category_id: 3,
  });
  addRecurring({
    title: "Doğalgaz",
    amount: 1400,
    day_of_month: 22,
    category_id: 3,
  });
  addRecurring({
    title: "İnternet (Türk Telekom)",
    amount: 499,
    day_of_month: 10,
    category_id: 3,
  });
  addRecurring({
    title: "Telefon (Turkcell)",
    amount: 350,
    day_of_month: 12,
    category_id: 3,
  });
  addRecurring({
    title: "Netflix",
    amount: 229.99,
    day_of_month: 7,
    category_id: 7,
  });
  addRecurring({
    title: "Spotify",
    amount: 59.99,
    day_of_month: 15,
    category_id: 7,
  });
  addRecurring({
    title: "Spor salonu (MACFit)",
    amount: 1200,
    day_of_month: 1,
    category_id: 6,
  });

  // Düzenli gelir şablonları
  const recurringIncomes: RecurringIncomeTemplate[] = [];
  let riId = 0;
  const addRecurringIncome = (p: {
    title: string;
    amount: number;
    day_of_month: number;
    note?: string;
  }) => {
    riId++;
    recurringIncomes.push({
      id: riId,
      user_id: 1,
      title: p.title,
      amount: p.amount,
      day_of_month: p.day_of_month,
      start_date: startISO,
      end_date: null,
      note: p.note,
      active: true,
      last_generated_month: null,
      created_at: ts(startISO),
      updated_at: ts(startISO),
    });
  };
  addRecurringIncome({
    title: "Maaş",
    amount: 75000,
    day_of_month: 1,
    note: "Net maaş",
  });
  addRecurringIncome({
    title: "Kira geliri (daire)",
    amount: 15000,
    day_of_month: 15,
  });

  return {
    expenses,
    incomes,
    recurring,
    recurringIncomes,
    nextExpenseId: _id + 1,
    nextIncomeId: incId + 1,
    nextRecurringId: rId + 1,
    nextRecurringIncomeId: riId + 1,
  };
}

const db: DB = buildDB();

// ---------------------------------------------------------------------------
// Occurrence türetimi (taksit ayları + düzenli projeksiyon) — backend davranışı
// ---------------------------------------------------------------------------
function ym(year: number, month: number) {
  return `${year}-${pad(month)}`;
}
function inRangeMonth(
  monthKey: string,
  startISO: string,
  endISO?: string | null,
): boolean {
  const s = startISO.slice(0, 7);
  if (monthKey < s) return false;
  if (endISO && monthKey > endISO.slice(0, 7)) return false;
  return true;
}

/** Bir occurrence'ın gösterileceği [yıl, ay]. Taksitte gösterim ayı, aksi halde işlem ayı. */
function occYearMonth(e: {
  installment_display_month?: string;
  expense_date: string;
}): [number, number] {
  const key = e.installment_display_month ?? e.expense_date.slice(0, 7);
  const [y, m] = key.split("-").map(Number);
  return [y, m];
}

/** Tüm gider occurrence'larını üretir (base + taksit açılımı + düzenli projeksiyon). */
function allExpenseOccurrences(): Expense[] {
  const out: Expense[] = [];

  for (const e of db.expenses) {
    if (
      e.payment_type === "installment" &&
      e.installment_count &&
      e.installment_count >= 2
    ) {
      const schedule = generateInstallmentSchedule(
        e.expense_date,
        e.total_amount,
        e.installment_count,
      );
      for (const s of schedule) {
        out.push({
          ...e,
          installment_display_month: s.date,
          installment_current_no: s.installmentNo,
        });
      }
    } else {
      out.push(e);
    }
  }

  // Düzenli giderler: 18 ay geri → 2 ay ileri ufkunda projeksiyon (projected:true)
  const horizon = monthRange(18, 2);
  for (const t of db.recurring) {
    if (!t.active) continue;
    for (const { year, month } of horizon) {
      const key = ym(year, month);
      if (!inRangeMonth(key, t.start_date, t.end_date)) continue;
      const date = iso(year, month, t.day_of_month);
      out.push(
        withCategory({
          id: -(t.id * 100000 + year * 100 + month),
          user_id: 1,
          category_id: t.category_id,
          title: t.title,
          expense_date: date,
          payment_type: "cash",
          total_amount: t.amount,
          note: t.note,
          items: [{ name: t.title, amount: t.amount }],
          created_at: ts(date),
          updated_at: ts(date),
          recurring_template_id: t.id,
          projected: true,
        }),
      );
    }
  }

  return out;
}

/** Tüm gelir occurrence'larını üretir (base + düzenli projeksiyon). */
function allIncomeOccurrences(): Income[] {
  const out: Income[] = [...db.incomes];
  const horizon = monthRange(18, 2);
  for (const t of db.recurringIncomes) {
    if (!t.active) continue;
    for (const { year, month } of horizon) {
      const key = ym(year, month);
      if (!inRangeMonth(key, t.start_date, t.end_date)) continue;
      const date = iso(year, month, t.day_of_month);
      out.push({
        id: -(t.id * 100000 + year * 100 + month),
        user_id: 1,
        title: t.title,
        amount: t.amount,
        income_date: date,
        note: t.note,
        created_at: ts(date),
        updated_at: ts(date),
        recurring_income_id: t.id,
        projected: true,
      });
    }
  }
  return out;
}

function expensesForPeriod(year: number, month?: number): Expense[] {
  return allExpenseOccurrences().filter((e) => {
    const [y, m] = occYearMonth(e);
    return y === year && (month == null || m === month);
  });
}

function incomesForPeriod(year: number, month?: number): Income[] {
  return allIncomeOccurrences().filter((i) => {
    const [y, m] = i.income_date.slice(0, 7).split("-").map(Number);
    return y === year && (month == null || m === month);
  });
}

// ---------------------------------------------------------------------------
// Analitik (yıllık) — occurrence'lardan hesaplanır; taksitte aylık pay kullanılır
// ---------------------------------------------------------------------------
function buildAnalytics(year: number): AnalyticsSummary {
  const expenses = expensesForPeriod(year).filter(
    (e) => e.category_id !== BIRIKIM_CATEGORY_ID,
  );
  const incomes = incomesForPeriod(year);

  const expByMonth = new Map<string, number>();
  const incByMonth = new Map<string, number>();
  const catTotals = new Map<number, number>();

  for (const e of expenses) {
    const [, m] = occYearMonth(e);
    const key = ym(year, m);
    const amt = displayAmount(e);
    expByMonth.set(key, (expByMonth.get(key) ?? 0) + amt);
    if (e.category_id)
      catTotals.set(e.category_id, (catTotals.get(e.category_id) ?? 0) + amt);
  }
  for (const i of incomes) {
    const m = Number(i.income_date.slice(5, 7));
    const key = ym(year, m);
    incByMonth.set(key, (incByMonth.get(key) ?? 0) + i.amount);
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const monthly_net = Array.from({ length: 12 }, (_, i) => {
    const key = ym(year, i + 1);
    const income = round2(incByMonth.get(key) ?? 0);
    const expense = round2(expByMonth.get(key) ?? 0);
    return { month: key, income, expense, net: round2(income - expense) };
  });

  const monthly_totals = monthly_net
    .filter((m) => m.expense > 0)
    .map((m) => ({ month: m.month, total: m.expense }));
  const income_totals = monthly_net
    .filter((m) => m.income > 0)
    .map((m) => ({ month: m.month, total: m.income }));

  const category_totals = Array.from(catTotals.entries())
    .map(([cid, total]) => {
      const c = catById(cid)!;
      return {
        name: c.name,
        icon: c.icon,
        color: c.color,
        total: round2(total),
      };
    })
    .sort((a, b) => b.total - a.total);

  // Taksit planı: bu yıla denk gelen taksitleri olan taksitli alımlar
  const installment_plan = db.expenses
    .filter(
      (e) =>
        e.payment_type === "installment" &&
        e.installment_count &&
        e.installment_count >= 2,
    )
    .map((e) => {
      const schedule = generateInstallmentSchedule(
        e.expense_date,
        e.total_amount,
        e.installment_count!,
      );
      const payments = schedule
        .filter((s) => s.date.startsWith(String(year)))
        .map((s) => ({
          month: s.date,
          amount: s.amount,
          installment_no: s.installmentNo,
        }));
      return {
        expense_id: e.id,
        title: e.title,
        total_amount: e.total_amount,
        installment_count: e.installment_count!,
        monthly_payment: schedule[0]?.amount ?? 0,
        payments,
      };
    })
    .filter((p) => p.payments.length > 0);

  const total_income = round2(incomes.reduce((s, i) => s + i.amount, 0));
  const total_expense = round2(
    expenses.reduce((s, e) => s + displayAmount(e), 0),
  );

  return {
    monthly_totals,
    category_totals,
    installment_plan,
    income_totals,
    monthly_net,
    year_summary: {
      total_income,
      total_expense,
      net: round2(total_income - total_expense),
    },
  };
}

// ---------------------------------------------------------------------------
// Router yardımcıları
// ---------------------------------------------------------------------------
const ok = (data: unknown) => ({ data });
const fail = (status: number, message: string) => ({
  error: { status, data: message } as unknown as FetchBaseQueryError,
});
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseQuery(url: string): Record<string, string> {
  const q = url.split("?")[1];
  if (!q) return {};
  return Object.fromEntries(
    q.split("&").map((p) => p.split("=").map(decodeURIComponent)),
  );
}
const pathOf = (url: string) => url.split("?")[0];

// ---------------------------------------------------------------------------
// Mock baseQuery — RTK Query'nin gerçek baseQuery'sinin yerine geçer (api.ts)
// ---------------------------------------------------------------------------
export const mockBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args) => {
  const url = typeof args === "string" ? args : args.url;
  const method = (
    typeof args === "string" ? "GET" : (args.method ?? "GET")
  ).toUpperCase();
  const body = (typeof args === "string" ? undefined : args.body) as any;
  const path = pathOf(url);
  const query = parseQuery(url);

  // Gerçekçi gecikme: skeleton/loading durumları görünsün
  await sleep(method === "GET" ? 220 : 380);

  // --- Auth ---
  if (path === "/auth/login" && method === "POST") {
    const email = String(body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body?.password ?? "");
    if (email === MOCK_CREDENTIALS.email && password === mockPassword) {
      return ok({ token: MOCK_TOKEN, user: DEMO_USER } satisfies AuthData);
    }
    return fail(400, "E-posta veya şifre hatalı");
  }
  if (path === "/auth/forgot-password" && method === "POST") {
    // Demo: sabit kodu 5 dk geçerli olacak şekilde "gönder". Varlık sızdırmamak için her zaman ok.
    mockReset = { code: MOCK_OTP, expires: Date.now() + 5 * 60_000, attempts: 0 };
    return ok({ message: "Eğer bu e-posta kayıtlıysa, bir doğrulama kodu gönderildi." });
  }
  if (path === "/auth/verify-otp" && method === "POST") {
    const code = String(body?.code ?? "");
    if (!mockReset || Date.now() > mockReset.expires) {
      mockReset = null;
      return fail(400, "Kod geçersiz veya süresi dolmuş");
    }
    if (mockReset.attempts >= 5) {
      mockReset = null;
      return fail(400, "Çok fazla yanlış deneme. Lütfen yeni kod isteyin.");
    }
    if (code !== mockReset.code) {
      mockReset.attempts += 1;
      const remaining = 5 - mockReset.attempts;
      if (remaining <= 0) {
        mockReset = null;
        return fail(400, "Çok fazla yanlış deneme. Lütfen yeni kod isteyin.");
      }
      return fail(400, `Kod hatalı. ${remaining} deneme hakkın kaldı.`);
    }
    mockReset = null;
    return ok({ resetToken: MOCK_RESET_TOKEN });
  }
  if (path === "/auth/reset-password" && method === "POST") {
    if (body?.resetToken !== MOCK_RESET_TOKEN) {
      return fail(401, "Oturum süresi doldu. Lütfen baştan deneyin.");
    }
    const next = String(body?.newPassword ?? "");
    if (next.length < 6) return fail(400, "Şifre en az 6 karakter olmalı");
    mockPassword = next;
    return ok({ message: "Şifren güncellendi" });
  }
  if (path === "/auth/profile" && method === "PUT") {
    const name = String(body?.name ?? "").trim();
    if (!name) return fail(400, "Ad gerekli");
    DEMO_USER = { ...DEMO_USER, name };
    return ok(DEMO_USER);
  }
  if (path === "/auth/password" && method === "PUT") {
    const current = String(body?.currentPassword ?? "");
    const next = String(body?.newPassword ?? "");
    if (current !== mockPassword) return fail(400, "Mevcut şifre hatalı");
    if (next.length < 6) return fail(400, "Yeni şifre en az 6 karakter olmalı");
    mockPassword = next;
    return ok({ success: true });
  }
  if (path === "/auth/register" && method === "POST") {
    const user: User = {
      id: 1,
      email: String(body?.email ?? "").trim(),
      name: body?.name ?? "Yeni Kullanıcı",
      hasPassword: true,
    };
    return ok({ token: MOCK_TOKEN, user, isNewUser: true } satisfies AuthData);
  }
  if (
    (path === "/auth/google" || path === "/auth/apple") &&
    method === "POST"
  ) {
    return ok({ token: MOCK_TOKEN, user: DEMO_OAUTH_USER } satisfies AuthData);
  }
  if (path === "/auth/account" && method === "DELETE") {
    // Demo: gerçek veri yok; başarı dön. Oturum kapatma akışı çağıran tarafta yürür.
    return ok({ success: true });
  }

  // --- Categories ---
  if (path === "/categories" && method === "GET") return ok(CATEGORIES);

  // --- Expenses ---
  if (path === "/expenses" && method === "GET") {
    const year = Number(query.year) || CUR_YEAR;
    const month = query.month ? Number(query.month) : undefined;
    return ok(expensesForPeriod(year, month));
  }
  if (path === "/expenses" && method === "POST") {
    const e = makeExpense(body);
    db.expenses.push(e);
    return ok(e);
  }
  if (path.startsWith("/expenses/") && method === "PUT") {
    const eid = Number(path.split("/")[2]);
    const idx = db.expenses.findIndex((x) => x.id === eid);
    if (idx === -1) return fail(404, "Harcama bulunamadı");
    const replaced = {
      ...makeExpense(body),
      id: eid,
      created_at: db.expenses[idx].created_at,
    };
    db.expenses[idx] = replaced;
    return ok(replaced);
  }
  if (path.startsWith("/expenses/") && method === "DELETE") {
    const eid = Number(path.split("/")[2]);
    db.expenses = db.expenses.filter((x) => x.id !== eid);
    return ok({ id: eid });
  }

  // --- Recurring (expense templates) ---
  if (path === "/recurring" && method === "GET") return ok(db.recurring);
  if (path === "/recurring" && method === "POST") {
    const t: RecurringTemplate = withCategory({
      id: db.nextRecurringId++,
      user_id: 1,
      ...body,
      end_date: body.end_date ?? null,
      active: true,
      last_generated_month: null,
      created_at: ts(body.start_date),
      updated_at: ts(body.start_date),
    });
    db.recurring.push(t);
    return ok(t);
  }
  if (path.startsWith("/recurring/") && method === "PUT") {
    const rid = Number(path.split("/")[2]);
    const idx = db.recurring.findIndex((x) => x.id === rid);
    if (idx === -1) return fail(404, "Şablon bulunamadı");
    db.recurring[idx] = withCategory({
      ...db.recurring[idx],
      ...body,
      updated_at: ts(NOW.toISOString().slice(0, 10)),
    });
    return ok(db.recurring[idx]);
  }
  if (path.startsWith("/recurring/") && method === "DELETE") {
    const rid = Number(path.split("/")[2]);
    db.recurring = db.recurring.filter((x) => x.id !== rid);
    return ok({ id: rid });
  }

  // --- Incomes ---
  if (path === "/incomes" && method === "GET") {
    const year = Number(query.year) || CUR_YEAR;
    const month = query.month ? Number(query.month) : undefined;
    return ok(incomesForPeriod(year, month));
  }
  if (path === "/incomes" && method === "POST") {
    const i: Income = {
      id: db.nextIncomeId++,
      user_id: 1,
      ...body,
      created_at: ts(body.income_date),
      updated_at: ts(body.income_date),
    };
    db.incomes.push(i);
    return ok(i);
  }
  if (path.startsWith("/incomes/") && method === "PUT") {
    const iid = Number(path.split("/")[2]);
    const idx = db.incomes.findIndex((x) => x.id === iid);
    if (idx === -1) return fail(404, "Gelir bulunamadı");
    db.incomes[idx] = {
      ...db.incomes[idx],
      ...body,
      updated_at: ts(NOW.toISOString().slice(0, 10)),
    };
    return ok(db.incomes[idx]);
  }
  if (path.startsWith("/incomes/") && method === "DELETE") {
    const iid = Number(path.split("/")[2]);
    db.incomes = db.incomes.filter((x) => x.id !== iid);
    return ok({ id: iid });
  }

  // --- Recurring incomes ---
  if (path === "/recurring-incomes" && method === "GET")
    return ok(db.recurringIncomes);
  if (path === "/recurring-incomes" && method === "POST") {
    const t: RecurringIncomeTemplate = {
      id: db.nextRecurringIncomeId++,
      user_id: 1,
      ...body,
      end_date: body.end_date ?? null,
      active: true,
      last_generated_month: null,
      created_at: ts(body.start_date),
      updated_at: ts(body.start_date),
    };
    db.recurringIncomes.push(t);
    return ok(t);
  }
  if (path.startsWith("/recurring-incomes/") && method === "PUT") {
    const rid = Number(path.split("/")[2]);
    const idx = db.recurringIncomes.findIndex((x) => x.id === rid);
    if (idx === -1) return fail(404, "Şablon bulunamadı");
    db.recurringIncomes[idx] = {
      ...db.recurringIncomes[idx],
      ...body,
      updated_at: ts(NOW.toISOString().slice(0, 10)),
    };
    return ok(db.recurringIncomes[idx]);
  }
  if (path.startsWith("/recurring-incomes/") && method === "DELETE") {
    const rid = Number(path.split("/")[2]);
    db.recurringIncomes = db.recurringIncomes.filter((x) => x.id !== rid);
    return ok({ id: rid });
  }

  // --- Analytics ---
  if (path === "/analytics" && method === "GET") {
    const year = Number(query.year) || CUR_YEAR;
    return ok(buildAnalytics(year));
  }

  return fail(404, `Mock endpoint yok: ${method} ${path}`);
};
