import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { formatExpense, calculateInstallmentAmount } from '@/lib/formatters';
import type { Expense } from '@/types';

// Taksitli harcamada ilerleme: kaçıncı taksit / toplam + aylık tutar.
export function InstallmentTimeline({ expense }: { expense: Expense }) {
  const count = expense.installment_count;
  if (expense.payment_type !== 'installment' || !count || count < 2) return null;

  const current = expense.installment_current_no ?? 0;
  const monthly = calculateInstallmentAmount(expense.total_amount, count);

  return (
    <View className="mt-2 gap-1.5 border-t border-border pt-2">
      <View className="flex-row items-center justify-between">
        <Text variant="muted">
          {current > 0 ? `${current}/${count}. taksit` : `${count} taksit`}
        </Text>
        <Text variant="muted">{formatExpense(monthly)} ₺/ay</Text>
      </View>
      <View className="flex-row gap-1">
        {Array.from({ length: count }, (_, i) => (
          <View
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              current > 0 && i < current ? 'bg-warning' : 'bg-surface',
            )}
          />
        ))}
      </View>
    </View>
  );
}
