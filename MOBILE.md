# 📱 Outflow Mobile — React Native Uygulama Planı (Commit Fazlı)

> Bu doküman, Outflow'u **telefona kurulabilen native bir uygulama** olarak React Native ile
> sıfırdan inşa etmek için adım adım, **commit fazlı** bir yol haritasıdır. Hem öğrenme hem de
> production hedefiyle, **en uygun ve güncel** kütüphaneler seçilmiştir.
>
> **Kritik karar:** Backend ve veritabanı **değişmez**. Mevcut Next.js Route Handler API'si
> (`/api/**`) ve MySQL şeması (bkz. [`SPEC.md`](./SPEC.md) §6–§9) **olduğu gibi kalır**. React
> Native uygulaması bu REST API'yi HTTPS üzerinden tüketir. Yani bu belge **yalnızca istemci
> (mobil) katmanını** tarif eder; API sözleşmesi, iş kuralları ve veri modeli için `SPEC.md`
> kaynaktır.

---

## 📋 İçindekiler

1. [Strateji ve Mimari Genel Bakış](#1-strateji-ve-mimari-genel-bakış)
2. [Teknoloji Seçimleri ve Gerekçeleri](#2-teknoloji-seçimleri-ve-gerekçeleri)
3. [Backend / API Stratejisi](#3-backend--api-stratejisi)
4. [Proje Dizin Yapısı (Clean Architecture)](#4-proje-dizin-yapısı-clean-architecture)
5. [Tasarım Sistemi (NativeWind)](#5-tasarım-sistemi-nativewind)
6. [İkon Stratejisi (Emoji Değil)](#6-i̇kon-stratejisi-emoji-değil)
7. [State & Data Katmanı](#7-state--data-katmanı)
8. [Navigasyon Yapısı](#8-navigasyon-yapısı)
9. [Reusable Bileşen Kütüphanesi](#9-reusable-bileşen-kütüphanesi)
10. [Ekran Haritası (Web → RN)](#10-ekran-haritası-web--rn)
11. [Commit Fazlı Yol Haritası](#11-commit-fazlı-yol-haritası)
12. [Build & Dağıtım (EAS)](#12-build--dağıtım-eas)
13. [Kabul Kriterleri](#13-kabul-kriterleri)
14. [Öğrenme Notları](#14-öğrenme-notları)

---

## 1. Strateji ve Mimari Genel Bakış

```
┌─────────────────────────┐         HTTPS / JWT          ┌──────────────────────────┐
│   Outflow Mobile (RN)   │  ───────────────────────────▶ │  Next.js API (mevcut)     │
│   Expo + expo-router    │   GET/POST/PUT/DELETE /api/** │  Route Handlers           │
│   NativeWind + RTK Query│  ◀─────────────────────────── │  → MySQL (değişmedi)      │
└─────────────────────────┘     { success, data }         └──────────────────────────┘
```

- **Tek backend, iki istemci:** Web (Next.js sayfaları) ve Mobile (RN) aynı API'yi paylaşır.
- **Paylaşılabilir saf TS:** `types/index.ts`, `lib/formatters.ts`, `lib/groupExpenses.ts` saf
  (platform-bağımsız) olduğu için RN projesine **kopyalanır** (ileride ortak pakete taşınabilir).
- **Monorepo-lite:** RN uygulaması aynı repoda `mobile/` klasöründe yaşar; kök dizin API backend'i
  olmaya devam eder.

---

## 2. Teknoloji Seçimleri ve Gerekçeleri

| İhtiyaç | Seçim | Neden |
|---|---|---|
| Çatı / araç zinciri | **Expo (SDK 52+)** | EAS Build ile telefona kolay kurulum, OTA güncelleme, geniş kütüphane uyumu, öğrenmesi kolay |
| Dil | **TypeScript** | Web ile tip paylaşımı, güvenlik |
| Routing | **expo-router (file-based)** | Next.js App Router'a çok benzer → mevcut zihin modelin doğrudan oturur |
| Stillendirme | **NativeWind v4** | **Tailwind CSS'in React Native karşılığı** — `className` ile birebir Tailwind sözdizimi |
| State (client) | **Redux Toolkit** | Web ile aynı pattern; auth/ui slice'ları |
| State (server/cache) | **RTK Query** | Caching, otomatik refetch, loading/error state — idiomatic veri katmanı |
| İkonlar | **lucide-react-native** | Web'deki Lucide ile tutarlı, temiz, tree-shake'li (emoji yerine) |
| Form | **react-hook-form + zod** | Performanslı, şema doğrulamalı formlar |
| Liste | **@shopify/flash-list** | Uzun harcama listelerinde yüksek performans |
| Alt sayfa/modal | **@gorhom/bottom-sheet** | Ekle/düzenle formları için native hisli bottom sheet |
| Tarih seçici | **@react-native-community/datetimepicker** | Platform-native date picker |
| Grafik | **react-native-gifted-charts** | Kolay, şık bar/line/pie; analitik için yeterli (alt: victory-native) |
| Token saklama | **expo-secure-store** | JWT'yi şifreli keychain/keystore'da tutar (localStorage RN'de yok) |
| Cache (hassas olmayan) | **@react-native-async-storage/async-storage** | RTK Query persist / offline taslak |
| Bildirim/Toast | **react-native-toast-message** | Web'deki toast davranışının karşılığı |
| Animasyon | **react-native-reanimated** + **react-native-gesture-handler** | Accordion, geçişler (Expo ile gelir) |
| Güvenli alan | **react-native-safe-area-context** | Çentik/status bar yönetimi |
| Haptik | **expo-haptics** | Etkileşim geri bildirimi |
| Lint/Format | **ESLint + Prettier** | Temiz kod |

> **Not (öğrenme):** RTK Query yeni gelebilir; alternatif olarak TanStack Query da idiomatic'tir.
> Web ile tutarlılık için RTK Query seçildi.

---

## 3. Backend / API Stratejisi

- API **değişmez**. Tek gereklilik: mobil cihazın API'ye erişebilmesi.
- **Geliştirmede** telefon `localhost`'a erişemez. Üç seçenek:
  1. Backend'i LAN IP'sinde çalıştır (`next dev -H 0.0.0.0`) → `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000`.
  2. Expo/ngrok tünel ile public URL.
  3. API'yi bir sunucuya deploy et (önerilen: Vercel + yönetilen MySQL) → sabit HTTPS URL.
- **CORS:** Route Handler'lar zaten JSON dönüyor; mobil isteklerde CORS tarayıcı kısıtı yok, ek
  ayar gerekmez. (Yine de güvenlik için yetkilendirme JWT ile sürer.)
- **Auth:** Login/register'dan dönen JWT `expo-secure-store`'a yazılır, her istekte
  `Authorization: Bearer <token>` gönderilir (web ile aynı sözleşme — `SPEC.md` §7).
- **Konfig:** `EXPO_PUBLIC_API_URL` ortam değişkeni (`app.config.ts` → `extra` veya doğrudan
  `process.env.EXPO_PUBLIC_*`).

---

## 4. Proje Dizin Yapısı (Clean Architecture)

```
mobile/
├── app.config.ts                 # Expo config (isim, ikon, splash, extra.apiUrl)
├── babel.config.js               # nativewind + reanimated plugin
├── metro.config.js               # nativewind
├── tailwind.config.js            # tema tokenları (web ile hizalı)
├── global.css                    # @tailwind direktifleri (nativewind v4)
├── tsconfig.json                 # path alias @/*
├── eas.json                      # build profilleri
├── package.json
└── src/
    ├── app/                      # expo-router (file-based routes)
    │   ├── _layout.tsx           # Root: Providers (Redux, SafeArea, BottomSheet, Toast, QueryCache)
    │   ├── index.tsx             # → auth durumuna göre yönlendir
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── login.tsx
    │   │   └── signup.tsx
    │   └── (tabs)/
    │       ├── _layout.tsx       # Bottom tab navigator + AuthGuard
    │       ├── index.tsx         # Harcamalar (ana)
    │       ├── gelirler.tsx
    │       ├── birikimler.tsx
    │       ├── analiz.tsx
    │       └── recurring.tsx
    ├── components/
    │   ├── ui/                   # REUSABLE primitives (platform-bağımsız tasarım)
    │   │   ├── Screen.tsx        # SafeArea + arka plan wrapper
    │   │   ├── Text.tsx          # tipografi varyantları
    │   │   ├── Button.tsx        # primary/secondary/ghost/danger
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── CurrencyInput.tsx # SPEC §9.2 kuralları
    │   │   ├── Badge.tsx         # peşin/taksit/birikim
    │   │   ├── Icon.tsx          # lucide wrapper
    │   │   ├── Select.tsx / Sheet seçim
    │   │   ├── EmptyState.tsx
    │   │   ├── SkeletonCard.tsx
    │   │   └── Field.tsx         # form alanı (label + error)
    │   ├── expenses/
    │   │   ├── ExpenseList.tsx   # FlashList
    │   │   ├── MonthGroup.tsx    # accordion (reanimated)
    │   │   ├── DayGroup.tsx
    │   │   ├── ExpenseCard.tsx
    │   │   ├── ExpenseItems.tsx
    │   │   ├── InstallmentTimeline.tsx
    │   │   └── ExpenseFormSheet.tsx  # bottom-sheet ekle/düzenle
    │   ├── income/
    │   │   ├── IncomeList.tsx
    │   │   ├── IncomeCard.tsx
    │   │   ├── IncomeFormSheet.tsx
    │   │   └── RecurringIncomeFormSheet.tsx
    │   ├── recurring/RecurringFormSheet.tsx
    │   └── analytics/{SummaryCards,MonthlyBars,CategoryBreakdown,NetList}.tsx
    ├── store/
    │   ├── index.ts              # configureStore + RTK Query middleware
    │   ├── hooks.ts              # typed hooks
    │   ├── api.ts                # RTK Query createApi (tüm endpoint'ler)
    │   └── slices/{authSlice,uiSlice}.ts
    ├── lib/
    │   ├── apiBase.ts            # baseQuery + token enjeksiyonu + 401 handling
    │   ├── secureToken.ts        # expo-secure-store sarmalayıcı
    │   ├── formatters.ts         # SPEC §9 (web'den kopya, saf TS)
    │   ├── groupExpenses.ts      # web'den kopya
    │   └── categoryIcons.ts      # kategori → lucide ikon + renk eşlemesi
    ├── theme/
    │   └── tokens.ts             # renk/spacing sabitleri (TS tarafı)
    ├── hooks/
    │   ├── useAuth.ts
    │   └── usePeriod.ts          # selectedYear/selectedMonth
    └── types/
        └── index.ts             # SPEC §10.3 (web'den kopya)
```

**Clean / reusable ilkeleri:**
- `components/ui` = tasarım primitifleri; iş mantığı içermez, her ekranda yeniden kullanılır.
- Ekrana özel bileşenler `components/<feature>` altında.
- Tüm sunucu erişimi tek yerde: `store/api.ts` (RTK Query). Bileşenler `useGetExpensesQuery` gibi
  generate edilmiş hook'ları kullanır — fetch detayını bilmez.
- Saf iş mantığı (`formatters`, `groupExpenses`) UI'dan tamamen ayrık ve test edilebilir.

---

## 5. Tasarım Sistemi (NativeWind)

NativeWind = React Native'de Tailwind. `className` prop'u ile birebir Tailwind sınıfları.

`tailwind.config.js` (web `SPEC.md` §13 paletiyle hizalı):
```js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#ffffff', foreground: '#0f172a', surface: '#f8fafc',
        border: '#e2e8f0', muted: '#64748b', accent: '#0f172a',
        success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
        emerald: { DEFAULT: '#059669', light: '#10b981' }, // birikim/gelir
      },
      fontFamily: { sans: ['Inter'], mono: ['SpaceMono'] },
    },
  },
};
```

Örnek kullanım:
```tsx
<View className="bg-white border border-border rounded-xl p-4">
  <Text className="font-mono text-foreground text-lg">{formatCurrency(v)} ₺</Text>
</View>
```

**Kurallar:**
- Kart: `bg-white border border-border rounded-xl p-4`.
- Rozetler: peşin → `bg-success/10 text-success`; taksit → `bg-warning/10 text-warning`;
  birikim/gelir → `bg-emerald/10 text-emerald`.
- Tutarlar daima `font-mono` + sağa hizalı.
- Tema tokenları hem `tailwind.config.js` (sınıflar) hem `theme/tokens.ts` (ikon rengi gibi JS
  ihtiyacı) için tek kaynaktan türetilir.

---

## 6. İkon Stratejisi (Emoji Değil)

- Kütüphane: **lucide-react-native** (+ `react-native-svg`).
- `components/ui/Icon.tsx`: isim + boyut + renk alan ince sarmalayıcı.
- Kategoriler DB'de emoji tutar; mobilde **emoji gösterilmez**. `lib/categoryIcons.ts` ile
  kategori adı/id → Lucide ikon + renk eşlenir:

```ts
import { Fuel, ShoppingCart, FileText, Shirt, Laptop, HeartPulse, Clapperboard,
         UtensilsCrossed, Bus, ShoppingBag, BookOpen, Package, PiggyBank } from 'lucide-react-native';

export const CATEGORY_ICONS: Record<number, { Icon: any; color: string }> = {
  1:  { Icon: Fuel,             color: '#EF4444' }, // Yakıt
  2:  { Icon: ShoppingCart,     color: '#22C55E' }, // Market
  3:  { Icon: FileText,         color: '#3B82F6' }, // Fatura
  4:  { Icon: Shirt,            color: '#8B5CF6' }, // Giyim
  5:  { Icon: Laptop,           color: '#F59E0B' }, // Elektronik
  6:  { Icon: HeartPulse,       color: '#EC4899' }, // Sağlık
  7:  { Icon: Clapperboard,     color: '#F97316' }, // Eğlence
  8:  { Icon: UtensilsCrossed,  color: '#84CC16' }, // Restoran
  9:  { Icon: Bus,              color: '#06B6D4' }, // Ulaşım
  10: { Icon: ShoppingBag,      color: '#A855F7' }, // Alışveriş
  11: { Icon: BookOpen,         color: '#10B981' }, // Eğitim
  12: { Icon: Package,          color: '#6B7280' }, // Diğer
  13: { Icon: PiggyBank,        color: '#059669' }, // Birikim
};
```
- Uygulama içi navigasyon/aksiyon ikonları da Lucide (`Plus`, `Pencil`, `Trash2`, `Calendar`,
  `TrendingUp`, `TrendingDown`, `Wallet`, vb.).

---

## 7. State & Data Katmanı

- **RTK Query (`store/api.ts`):** tüm sunucu çağrıları. Tek `createApi`, tag tabanlı cache
  invalidation (mutasyon sonrası otomatik refetch).
  - Endpoint'ler (SPEC §8): `login`, `register`, `getCategories`, `getExpenses`, `createExpense`,
    `updateExpense`, `deleteExpense`, `getRecurring`, `createRecurring`, `updateRecurring`,
    `deleteRecurring`, `getIncomes`, `createIncome`, `updateIncome`, `deleteIncome`,
    `getRecurringIncomes` (+ CRUD), `getAnalytics`.
  - Tag'ler: `Expense`, `Income`, `Recurring`, `RecurringIncome`, `Analytics`, `Category`.
- **`lib/apiBase.ts`:** `fetchBaseQuery` + `prepareHeaders` ile token enjeksiyonu; `401` →
  token sil + auth slice `logout` + login'e yönlendir.
- **authSlice:** `user`, `token`, `status`. Uygulama açılışında `secureToken.get()` ile hidrasyon.
- **uiSlice:** toast kuyruğu, aktif dönem (year/month) opsiyonel olarak buraya da konabilir.

```ts
// lib/apiBase.ts (özet)
export const baseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  prepareHeaders: async (headers) => {
    const token = await getToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});
```

---

## 8. Navigasyon Yapısı

- **expo-router** ile file-based. İki grup: `(auth)` ve `(tabs)`.
- Kök `app/index.tsx`: token varsa `(tabs)`, yoksa `(auth)/login`.
- **Bottom Tab Bar** (Lucide ikonlu):
  | Tab | İkon | Rota |
  |---|---|---|
  | Harcamalar | `Wallet` | `(tabs)/index` |
  | Gelirler | `TrendingUp` | `(tabs)/gelirler` |
  | Birikimler | `PiggyBank` | `(tabs)/birikimler` |
  | Analiz | `BarChart3` | `(tabs)/analiz` |
  | Düzenli | `Repeat` | `(tabs)/recurring` |
- Ekle/düzenle akışları **bottom-sheet** ile (yeni rota yerine), böylece bağlam kaybolmaz.
- `AuthGuard`: `(tabs)/_layout.tsx` içinde token kontrolü; yoksa `redirect`.

---

## 9. Reusable Bileşen Kütüphanesi

`components/ui` minimum sözleşmeleri:
- **Screen**: `SafeAreaView` + `bg-background` + opsiyonel scroll + `refreshControl`.
- **Text**: `variant` (`h1|h2|body|muted|mono`) → tutarlı tipografi.
- **Button**: `variant` (`primary|secondary|ghost|danger`), `loading`, `leftIcon`, tam genişlik.
- **Card**: standart kart kabuğu.
- **Input / Field**: label + hata + `react-hook-form` `Controller` uyumlu.
- **CurrencyInput**: yalnız rakam; `parseCurrencyInput` (SPEC §9.2); blur'da `formatCurrency`.
- **Badge**: renk varyantları (peşin/taksit/birikim/gelir).
- **Icon**: Lucide sarmalayıcı (`name` yerine doğrudan component prop ya da map).
- **EmptyState / SkeletonCard**: boş ve yükleniyor durumları.
- **SheetForm kabukları**: `@gorhom/bottom-sheet` üzerinde ortak form düzeni.

> Her ekran yalnız bu primitifleri ve kendi `feature` bileşenlerini kullanır; ham `View/Text` +
> inline stil tekrarı yapılmaz.

---

## 10. Ekran Haritası (Web → RN)

| Web (`SPEC.md` §12) | RN Rotası | Notlar |
|---|---|---|
| `/login`, `/signup` | `(auth)/login`, `(auth)/signup` | react-hook-form + zod |
| `/expenses` | `(tabs)/index` | FlashList + accordion MonthGroup, FAB "+" |
| AddExpenseModal | `ExpenseFormSheet` | bottom-sheet, dinamik kalemler |
| `/recurring` | `(tabs)/recurring` | şablon listesi + `RecurringFormSheet` |
| `/birikimler` | `(tabs)/birikimler` | kategori 13, emerald tema |
| `/gelirler` | `(tabs)/gelirler` | tekrarlayan gelir + tek seferlik gelir |
| `/analytics` | `(tabs)/analiz` | kartlar + grafikler + net listesi |
| `/dashboard` | (ops.) ana tab üstü özet | özet barı olarak gömülebilir |

---

## 11. Commit Fazlı Yol Haritası

> Her faz **bir veya birkaç commit** ile biter. Commit mesajları Conventional Commits.
> Her fazın sonunda uygulama **derlenebilir ve çalışır** durumda olmalı.

### Faz 0 — İskelet
- `mobile/` altında Expo + TypeScript + expo-router projesi (`npx create-expo-app -t`).
- Path alias `@/* → src/*`. Çalışır "Hello" ekranı.
- ✅ `git commit -m "chore(mobile): scaffold expo + typescript + expo-router"`

### Faz 1 — Araç Zinciri & Tema
- NativeWind v4 kur (`babel`, `metro`, `global.css`, `tailwind.config.js`).
- ESLint + Prettier. Font yükleme (Inter + SpaceMono, `expo-font`).
- `theme/tokens.ts`. Örnek bir `Text`/`View` ile NativeWind doğrulaması.
- ✅ `chore(mobile): configure nativewind, theme tokens, lint/format`

### Faz 2 — Çekirdek Altyapı
- `types/index.ts`, `lib/formatters.ts`, `lib/groupExpenses.ts` (web'den kopya).
- `lib/secureToken.ts` (expo-secure-store), `lib/apiBase.ts`, `lib/categoryIcons.ts`.
- `EXPO_PUBLIC_API_URL` konfigürasyonu (`app.config.ts`).
- ✅ `feat(mobile): core infra — types, formatters, secure token, api base`

### Faz 3 — State & Data
- `store/index.ts`, `store/hooks.ts`, `store/api.ts` (RTK Query, tüm endpoint + tag'ler),
  `slices/authSlice.ts`, `slices/uiSlice.ts`.
- Root `_layout.tsx`'e Redux Provider + SafeArea + BottomSheet + Toast host.
- ✅ `feat(mobile): redux store with rtk query api and auth/ui slices`

### Faz 4 — Reusable UI Kütüphanesi
- `components/ui/*`: Screen, Text, Button, Card, Input, Field, CurrencyInput, Badge, Icon,
  EmptyState, SkeletonCard.
- ✅ `feat(mobile): reusable ui component library`

### Faz 5 — Navigasyon & Auth Gate
- `(auth)` ve `(tabs)` grupları, bottom tab bar (Lucide ikon), `AuthGuard`, `index.tsx` yönlendirme.
- ✅ `feat(mobile): navigation with auth gate and bottom tabs`

### Faz 6 — Auth Ekranları
- `login.tsx`, `signup.tsx` (react-hook-form + zod), RTK Query `login/register` mutasyonu,
  başarıda token secure-store'a + `(tabs)`'a yönlendir.
- ✅ `feat(mobile): login and signup screens`

### Faz 7 — Harcama Listesi
- `usePeriod` (year/month), yıl seçici + ay filtre çubuğu.
- `ExpenseList` (FlashList) → `MonthGroup` (accordion) → `DayGroup` → `ExpenseCard` →
  `ExpenseItems` + `InstallmentTimeline`. `getExpenses` ile veri. Pull-to-refresh.
- ✅ `feat(mobile): expenses list with month/day grouping and installments`

### Faz 8 — Harcama Ekle/Düzenle/Sil
- `ExpenseFormSheet` (bottom-sheet): başlık, tarih (datetimepicker), kategori (sheet select),
  ödeme tipi toggle, taksit sayısı, dinamik kalemler (`CurrencyInput`), canlı toplam + aylık taksit.
- Create/update/delete mutasyonları + onay + toast.
- ✅ `feat(mobile): add/edit/delete expense flow`

### Faz 9 — Düzenli Ödemeler
- `recurring.tsx` liste + `RecurringFormSheet` (tutar, ayın günü 1–28, başlangıç/bitiş, kategori).
- ✅ `feat(mobile): recurring templates management`

### Faz 10 — Birikimler
- `birikimler.tsx`: kategori 13 filtresi, emerald özet barı, kategori-sabitli ekleme.
- ✅ `feat(mobile): savings screen`

### Faz 11 — Gelirler
- `gelirler.tsx`: tekrarlayan gelir (maaş) + tek seferlik ek gelir; `IncomeList`, `IncomeCard`,
  `IncomeFormSheet`, `RecurringIncomeFormSheet`. (SPEC §3.7, §8.11–8.16)
- ✅ `feat(mobile): incomes and recurring incomes`

### Faz 12 — Analiz
- `analiz.tsx`: özet kartları (gelir/gider/net, peşin/taksit), `MonthlyBars` (gelir vs gider),
  `CategoryBreakdown`, `NetList` (aylık net, pozitif yeşil/negatif kırmızı). (SPEC §8.17)
- ✅ `feat(mobile): analytics with charts and net balance`

### Faz 13 — Cila
- Reanimated geçişleri, `expo-haptics`, boş/yükleniyor/hata durumları, RTK Query offline cache
  (AsyncStorage persist), erişilebilirlik etiketleri.
- ✅ `feat(mobile): polish — animations, haptics, offline cache, a11y`

### Faz 14 — Marka & Build
- App ikon + splash (`app.config.ts`), uygulama adı, `eas.json` profilleri.
- EAS Build ile Android APK/AAB (+ iOS gerekiyorsa) üretimi.
- ✅ `chore(mobile): app icon, splash, eas build configuration`

### Faz 15 — QA
- §13 kabul kriterlerini cihazda doğrula, hata düzelt.
- ✅ `test(mobile): manual QA pass and fixes`

---

## 12. Build & Dağıtım (EAS)

- `npm i -g eas-cli` → `eas login` → `eas build:configure`.
- **Android (herkese kolay kurulum):** `eas build -p android --profile preview` → indirilebilir
  **APK** linki (cihaza doğrudan kur). Mağaza için `--profile production` (AAB) + Play Console.
- **iOS:** `eas build -p ios` (Apple Developer hesabı gerekir); test için TestFlight.
- **OTA güncelleme:** `eas update` ile JS değişikliklerini build almadan dağıt.
- `eas.json` profilleri: `development` (dev client), `preview` (internal APK), `production` (store).
- API URL'i profil bazında `EXPO_PUBLIC_API_URL` ile ver (preview/prod → deploy edilmiş HTTPS API).

---

## 13. Kabul Kriterleri

- [ ] APK gerçek bir Android telefona kurulup açılıyor.
- [ ] Kayıt/giriş çalışıyor; token secure-store'da kalıcı; uygulama yeniden açılınca oturum sürüyor.
- [ ] `401`'de otomatik logout + login'e yönlendirme.
- [ ] Harcama listesi ay/gün gruplu; accordion açılıp kapanıyor; FlashList akıcı.
- [ ] Peşin & çok kalemli taksitli harcama eklenebiliyor; toplam ve aylık taksit doğru (SPEC §9.1).
- [ ] Taksitli alım sonraki aylarda ödeme satırı olarak görünüyor.
- [ ] Düzenli ödeme + tekrarlayan gelir (maaş) ilgili aylarda otomatik üretiliyor, çoğalmıyor.
- [ ] Birikim ekranı yalnız kategori 13'ü gösteriyor; ekleme kategoriyi sabitliyor.
- [ ] Analizde aylık gelir/gider/net doğru; net pozitif yeşil, negatif kırmızı.
- [ ] Hiçbir yerde emoji ikon yok; tüm ikonlar Lucide.
- [ ] Pull-to-refresh, boş durum, skeleton, toast çalışıyor.
- [ ] Para ve tarih Türkçe formatında (`1.234,56 ₺`).
- [ ] `npx tsc --noEmit` ve lint temiz.

---

## 14. Öğrenme Notları

- **expo-router ≈ Next.js App Router:** klasör = rota, `_layout.tsx` = layout. Mevcut bilgin direkt geçerli.
- **NativeWind ≈ Tailwind:** `className` aynı; bazı web-only sınıflar (hover gibi) yok, `active:`/
  `gap` çoğu yerde var. Stil = utility-first, ayrı StyleSheet yazmazsın.
- **RTK Query:** `useGetExpensesQuery({year, month})` çağrısı veri + `isLoading` + `refetch` verir;
  mutasyonlar tag invalidate edince liste otomatik tazelenir. Manuel "loading state" yönetimi azalır.
- **Web ≠ RN bileşenleri:** `div→View`, `span/p→Text`, `button→Pressable`, `input→TextInput`,
  `img→Image`. Tüm metin **mutlaka** `<Text>` içinde olmalı.
- **localStorage yok:** hassas veri `expo-secure-store`, gerisi `async-storage`.
- **Saf mantığı paylaş:** `formatters`, `groupExpenses`, taksit hesapları web ile birebir aynı —
  kopyaladığın bu dosyaları değiştirme; ileride `packages/shared` ortak paketine taşı.

---

*Bu plan yalnız mobil istemciyi tarif eder. Veri modeli, API sözleşmesi ve iş kuralları için tek
kaynak `SPEC.md`'dir. Backend ve MySQL şeması değişmeden korunur.*
