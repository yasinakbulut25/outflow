import { useCallback, useMemo } from 'react';
import { View, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Wallet } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useGetExpensesQuery, useGetRecurringQuery } from '@/store/api';
import { usePeriod } from '@/hooks/usePeriod';
import { groupExpensesByMonthAndDay } from '@/lib/groupExpenses';
import { projectRecurring } from '@/lib/projectRecurring';
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
  // Sadece "Tümü" görünümünde gelecek aylar için sanal planlanan kayıtlar üret.
  const { data: templates } = useGetRecurringQuery(undefined, { skip: month != null });

  const groups = useMemo(() => {
    const actual = data ?? [];
    const merged = month == null ? [...actual, ...projectRecurring(templates ?? [], actual, year)] : actual;
    return groupExpensesByMonthAndDay(merged);
  }, [data, templates, month, year]);

  // Açılışta cari ayı aç (yoksa en güncel grubu) — planlanan gelecek aylar değil.
  const expandKey = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (groups.some((g) => g.monthKey === todayKey)) return todayKey;
    return groups[0]?.monthKey;
  }, [groups]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof groups)[number] }) => (
      <MonthGroup group={item} defaultExpanded={item.monthKey === expandKey} onPressExpense={onPressExpense} />
    ),
    [onPressExpense, expandKey],
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
