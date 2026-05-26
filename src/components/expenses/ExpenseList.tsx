import { useCallback, useMemo } from 'react';
import { View, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Wallet } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useGetExpensesQuery } from '@/store/api';
import { usePeriod } from '@/hooks/usePeriod';
import { groupExpensesByMonthAndDay } from '@/lib/groupExpenses';
import { PeriodBar } from './PeriodBar';
import { MonthGroup } from './MonthGroup';
import type { Expense } from '@/types';

export function ExpenseList({ onPressExpense }: { onPressExpense?: (e: Expense) => void }) {
  const { year, month } = usePeriod();
  // Backend materyalizasyonu GET'in yan etkisi ve bakılan aya bağlı; dönem değişince
  // taze veri çek ki "Tümü" görünümü ay gezinmesinin ürettiği satırları yansıtsın.
  const { data, isLoading, isFetching, refetch } = useGetExpensesQuery(
    { year, month: month ?? undefined },
    { refetchOnMountOrArgChange: true },
  );

  const groups = useMemo(() => groupExpensesByMonthAndDay(data ?? []), [data]);

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof groups)[number]; index: number }) => (
      <MonthGroup group={item} defaultExpanded={index === 0} onPressExpense={onPressExpense} />
    ),
    [onPressExpense],
  );

  if (isLoading) {
    return (
      <View className="flex-1 px-4">
        <PeriodBar />
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlashList
      data={groups}
      keyExtractor={(g) => g.monthKey}
      renderItem={renderItem}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      ListHeaderComponent={<PeriodBar />}
      ListEmptyComponent={<EmptyState message="Bu dönemde harcama yok." icon={Wallet} />}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    />
  );
}
