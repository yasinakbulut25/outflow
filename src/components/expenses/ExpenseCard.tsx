import { View, Pressable } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { categoryIcon } from '@/lib/categoryIcons';
import { displayAmount } from '@/lib/groupExpenses';
import { formatCurrency } from '@/lib/formatters';
import { ExpenseItems } from './ExpenseItems';
import { InstallmentTimeline } from './InstallmentTimeline';
import type { Expense } from '@/types';

export function ExpenseCard({ expense, onPress }: { expense: Expense; onPress?: (e: Expense) => void }) {
  const { Icon: CatIcon, color } = categoryIcon(expense.category_id);
  const isInstallment = expense.payment_type === 'installment';
  const projected = expense.projected;
  const amount = displayAmount(expense);

  return (
    <Pressable
      onPress={projected ? undefined : () => onPress?.(expense)}
      disabled={projected}
      className={cn('active:opacity-70', projected && 'opacity-60')}
    >
      <Card className="mb-2">
        <View className="flex-row items-center gap-3">
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: color + '1a' }}
          >
            <Icon icon={CatIcon} size={18} color={color} />
          </View>

          <View className="flex-1">
            <Text variant="body" className="font-medium" numberOfLines={1}>
              {expense.title}
            </Text>
            {expense.category_name ? (
              <Text variant="muted">{expense.category_name}</Text>
            ) : null}
          </View>

          <View className="items-end gap-1">
            <Text variant="mono">{formatCurrency(amount)} ₺</Text>
            {projected ? (
              <Badge label="Planlanan" tone="neutral" />
            ) : (
              <Badge
                label={isInstallment ? 'Taksit' : 'Peşin'}
                tone={isInstallment ? 'installment' : 'cash'}
              />
            )}
          </View>
        </View>

        <ExpenseItems items={expense.items} />
        <InstallmentTimeline expense={expense} />
      </Card>
    </Pressable>
  );
}
