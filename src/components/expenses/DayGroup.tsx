import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { formatDayHeader } from '@/lib/formatters';
import { ExpenseCard } from './ExpenseCard';
import type { DayGroup as DayGroupModel } from '@/lib/groupExpenses';
import type { Expense } from '@/types';

export function DayGroup({ day, onPressExpense }: { day: DayGroupModel; onPressExpense?: (e: Expense) => void }) {
  return (
    <View className="mb-3">
      <Text variant="muted" className="mb-1.5 capitalize">
        {formatDayHeader(day.date)}
      </Text>
      {day.expenses.map((e) => (
        <ExpenseCard key={e.id} expense={e} onPress={onPressExpense} />
      ))}
    </View>
  );
}
