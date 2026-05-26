import type { Expense } from '@/types';

// Harcamaları aya ve güne göre gruplar (SPEC.md §10.2). Web ile aynı mantık.
// Taksit gösterim aylarında installment_display_month kullanılır.
// Düzenli ödemeler (recurring_template_id dolu — materyalize gerçek veya planlanan)
// gün gruplarına karışmaz; ayrı `recurring` listesinde toplanır.

export interface DayGroup {
  date: string; // YYYY-MM-DD
  expenses: Expense[];
}

export interface MonthGroup {
  year: number;
  month: number; // 1-12
  monthKey: string; // "2026-05"
  totalAmount: number; // ayın toplamı (tek seferlik + taksit + düzenli)
  cashAmount: number; // düzenli olmayan peşin
  installmentAmount: number; // düzenli olmayan taksit
  recurringAmount: number; // düzenli ödemeler toplamı (gerçek + planlanan)
  days: DayGroup[]; // yalnız düzenli OLMAYAN giderler
  recurring: Expense[]; // düzenli ödemeler (tarihe göre artan)
}

/** Bir harcamanın bu listedeki gösterim tarihini döndürür (taksit ayı varsa onu kullanır). */
function displayDate(e: Expense): string {
  if (e.installment_display_month) return `${e.installment_display_month}-01`;
  return e.expense_date.slice(0, 10);
}

/** Bu listede gösterilecek tutar (taksit ayında aylık taksit, aksi halde toplam). */
export function displayAmount(e: Expense): number {
  if (e.installment_display_month && e.installment_count) {
    return Math.round((e.total_amount / e.installment_count) * 100) / 100;
  }
  return e.total_amount;
}

export function groupExpensesByMonthAndDay(expenses: Expense[]): MonthGroup[] {
  const monthMap = new Map<string, MonthGroup>();

  for (const expense of expenses) {
    const dateKey = displayDate(expense);
    const [year, month] = dateKey.split('-').map(Number);
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const amount = displayAmount(expense);

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        year, month, monthKey,
        totalAmount: 0, cashAmount: 0, installmentAmount: 0, recurringAmount: 0,
        days: [], recurring: [],
      });
    }

    const monthGroup = monthMap.get(monthKey)!;
    monthGroup.totalAmount += amount;

    if (expense.recurring_template_id) {
      // Düzenli ödeme (materyalize gerçek veya planlanan) → ayrı bölüm.
      monthGroup.recurringAmount += amount;
      monthGroup.recurring.push(expense);
      continue;
    }

    if (expense.payment_type === 'cash') {
      monthGroup.cashAmount += amount;
    } else {
      monthGroup.installmentAmount += amount;
    }

    let dayGroup = monthGroup.days.find((d) => d.date === dateKey);
    if (!dayGroup) {
      dayGroup = { date: dateKey, expenses: [] };
      monthGroup.days.push(dayGroup);
    }
    dayGroup.expenses.push(expense);
  }

  for (const month of monthMap.values()) {
    month.days.sort((a, b) => b.date.localeCompare(a.date));
    month.recurring.sort((a, b) => a.expense_date.localeCompare(b.expense_date));
  }

  return Array.from(monthMap.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
