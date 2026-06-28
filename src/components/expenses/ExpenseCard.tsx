import { View, Pressable } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { categoryIcon } from '@/lib/categoryIcons';
import { displayAmount } from '@/lib/groupExpenses';
import { useTranslation, useFormat, useCategoryName } from '@/i18n';
import { ExpenseItems } from './ExpenseItems';
import { InstallmentTimeline } from './InstallmentTimeline';
import type { Expense } from '@/types';

export function ExpenseCard({ expense, onPress }: { expense: Expense; onPress?: (e: Expense) => void }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const catName = useCategoryName();
  const { Icon: CatIcon, color } = categoryIcon(expense.category_id);
  const isInstallment = expense.payment_type === 'installment';
  // Düzenli ödeme occurrence'ı (şablondan türetilmiş). Tek başına düzenlenmez;
  // dokununca şablon düzenleme sheet'i açılır (onPress bunu yönlendirir).
  const isRecurring = !!expense.recurring_template_id;
  const amount = displayAmount(expense);

  return (
    <Pressable
      onPress={() => onPress?.(expense)}
      className="active:opacity-70"
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
            {expense.category_id != null ? (
              <Text variant="muted">{catName(expense.category_id)}</Text>
            ) : null}
          </View>

          <View className="items-end gap-1">
            <Text variant="mono">{fmt.moneySigned(amount)}</Text>
            {isRecurring ? (
              <Badge label={t('expenses.recurring')} tone="neutral" />
            ) : (
              <Badge
                label={isInstallment ? t('expenses.installment') : t('expenses.cash')}
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
