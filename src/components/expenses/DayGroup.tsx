import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useFormat } from '@/i18n';
import { ExpenseCard } from './ExpenseCard';
import type { DayGroup as DayGroupModel } from '@/lib/groupExpenses';
import type { Expense } from '@/types';

export function DayGroup({ day, onPressExpense }: { day: DayGroupModel; onPressExpense?: (e: Expense) => void }) {
  const fmt = useFormat();
  return (
    <View className="mb-3">
      <Text variant="muted" className="mb-1.5 capitalize">
        {fmt.dayHeader(day.date)}
      </Text>
      {day.expenses.map((e) => (
        <ExpenseCard key={e.id} expense={e} onPress={onPressExpense} />
      ))}
    </View>
  );
}
