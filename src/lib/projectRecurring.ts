import type { Expense, RecurringTemplate } from '@/types';

// Aktif düzenli ödeme şablonlarından, seçili yılda gerçek satırı OLMAYAN aylar için
// sanal "planlanan" Expense kayıtları üretir. DB'ye yazılmaz; tamamen client-side.
// Backend cari yılın "Tümü" görünümünü yalnız bugüne kadar materyalize ettiğinden,
// gelecek aylar bu projeksiyonla gösterilir (§9.3 lazy materyalizasyon korunur).

const pad2 = (n: number) => String(n).padStart(2, '0');
const clampDay = (y: number, m: number, d: number) => Math.min(d, new Date(y, m, 0).getDate());

export function projectRecurring(
  templates: RecurringTemplate[],
  actual: Expense[],
  year: number,
): Expense[] {
  // (şablon, ay) için gerçek satır var mı?
  const have = new Set<string>();
  for (const e of actual) {
    if (e.recurring_template_id) have.add(`${e.recurring_template_id}-${e.expense_date.slice(0, 7)}`);
  }

  const out: Expense[] = [];
  for (const tpl of templates) {
    if (!tpl.active) continue;
    const [sy, sm] = tpl.start_date.slice(0, 10).split('-').map(Number);
    const endMonth = tpl.end_date ? tpl.end_date.slice(0, 7) : null; // YYYY-MM

    for (let m = 1; m <= 12; m++) {
      if (year < sy || (year === sy && m < sm)) continue; // başlangıçtan önce
      const key = `${year}-${pad2(m)}`;
      if (endMonth && key > endMonth) break; // bitişten sonra
      if (have.has(`${tpl.id}-${key}`)) continue; // gerçek satır var → atla

      const date = `${key}-${pad2(clampDay(year, m, tpl.day_of_month))}`;
      out.push({
        id: -(tpl.id * 100 + m), // negatif → gerçek id'lerle çakışmaz
        user_id: tpl.user_id,
        category_id: tpl.category_id,
        category_name: tpl.category_name,
        title: tpl.title,
        expense_date: date,
        payment_type: 'cash',
        total_amount: tpl.amount,
        items: [{ name: tpl.title, amount: tpl.amount }],
        recurring_template_id: tpl.id,
        created_at: date,
        updated_at: date,
        projected: true,
      });
    }
  }
  return out;
}
