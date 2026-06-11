// Saf TS yardımcıları — outflow-api / web ile birebir aynı (SPEC.md §9).
// Platform bağımsızdır; React Native'de de aynen çalışır.

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Girdi: yalnız rakam → sayı. Son 2 hane kuruş. "425000" → 4250.00 */
export function parseCurrencyInput(rawDigits: string): number {
  if (!rawDigits) return 0;
  const padded = rawDigits.padStart(3, '0');
  const intPart = padded.slice(0, -2);
  const decPart = padded.slice(-2);
  return parseFloat(`${intPart || '0'}.${decPart}`);
}

export function formatDate(dateStr: string, format: 'long' | 'short' = 'long'): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (format === 'short') {
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  }
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
}

export function getMonthName(monthIndex: number): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  return months[monthIndex - 1] ?? '';
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
  const startDate = getInstallmentStartMonth(expenseDate);
  const schedule = [];
  for (let i = 0; i < installmentCount; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    schedule.push({ date: d.toISOString().slice(0, 7), amount: monthlyAmount, installmentNo: i + 1 });
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

export function formatMonthYear(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  return `${getMonthName(month)} ${year}`;
}

/** YYYY-MM-DD (bugün, yerel) */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
