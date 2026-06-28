// Saf TS yardımcıları — dile göre yerelleştirilir. Tüm para/tarih biçimlendirme
// işlevleri açık `lang` parametresi alır; React tarafı için useFormat() hook'u
// (src/i18n) bunları aktif dile bağlar. Platform bağımsızdır.
import { NUMBER_LOCALE, type Language } from '@/i18n/locale';
import { resources } from '@/i18n/translations';

export function formatNumber(value: number, lang: Language): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[lang], {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Gider gösterimi: pozitif tutarın başına eksi koyar (-1.250) — paranın çıktığı/eksildiği
 *  net anlaşılsın diye. Yalnızca UI gösterimi içindir; saklanan değer pozitif kalır. */
export function formatSigned(value: number, lang: Language): string {
  return value > 0 ? `-${formatNumber(value, lang)}` : formatNumber(value, lang);
}

/** Girdi: yalnız rakam → sayı. Son 2 hane kuruş. "425000" → 4250.00 */
export function parseCurrencyInput(rawDigits: string): number {
  if (!rawDigits) return 0;
  const padded = rawDigits.padStart(3, '0');
  const intPart = padded.slice(0, -2);
  const decPart = padded.slice(-2);
  return parseFloat(`${intPart || '0'}.${decPart}`);
}

export function formatDate(dateStr: string, lang: Language, format: 'long' | 'short' = 'long'): string {
  const date = new Date(dateStr + 'T00:00:00');
  const locale = NUMBER_LOCALE[lang];
  if (format === 'short') {
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  }
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDayHeader(dateStr: string, lang: Language): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(NUMBER_LOCALE[lang], { day: 'numeric', month: 'long', weekday: 'long' });
}

export function getMonthName(monthIndex: number, lang: Language): string {
  return resources[lang].months.long[monthIndex - 1] ?? '';
}

export function calculateInstallmentAmount(total: number, count: number): number {
  return Math.round((total / count) * 100) / 100;
}

// Taksit takvimi satın alınan aydan başlar (1. taksit = alım ayı).
export function getInstallmentStartMonth(expenseDate: string): Date {
  const d = new Date(expenseDate + 'T00:00:00');
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function generateInstallmentSchedule(
  expenseDate: string,
  totalAmount: number,
  installmentCount: number
): { date: string; amount: number; installmentNo: number }[] {
  const monthlyAmount = calculateInstallmentAmount(totalAmount, installmentCount);
  // 1. taksit = alım ayı. Ay anahtarı tamsayı aritmetiğiyle üretilir; `new Date(...).toISOString()`
  // yerel gece yarısını UTC'ye çevirip UTC+ saat dilimlerinde ayın 1'ini bir geri kaydırırdı.
  const [year, month] = expenseDate.slice(0, 7).split('-').map(Number); // month: 1-12
  const schedule = [];
  for (let i = 0; i < installmentCount; i++) {
    const offset = month - 1 + i; // alım ayından itibaren 0-bazlı
    const y = year + Math.floor(offset / 12);
    const m = (offset % 12) + 1;
    schedule.push({ date: `${y}-${String(m).padStart(2, '0')}`, amount: monthlyAmount, installmentNo: i + 1 });
  }
  return schedule;
}

export function isCurrentMonth(monthStr: string): boolean {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return monthStr === current;
}

export function isPastMonth(monthStr: string): boolean {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return monthStr < current;
}

export function formatMonthYear(monthStr: string, lang: Language): string {
  const [year, month] = monthStr.split('-').map(Number);
  return `${getMonthName(month, lang)} ${year}`;
}

/** YYYY-MM-DD (bugün, yerel) */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
