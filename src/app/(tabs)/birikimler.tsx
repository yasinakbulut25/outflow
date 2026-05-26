import { useMemo, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Plus, PiggyBank } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { PeriodBar } from '@/components/expenses/PeriodBar';
import { ExpenseFormSheet, type ExpenseFormSheetRef } from '@/components/expenses/ExpenseFormSheet';
import { useGetExpensesQuery } from '@/store/api';
import { usePeriod } from '@/hooks/usePeriod';
import { displayAmount } from '@/lib/groupExpenses';
import { formatCurrency } from '@/lib/formatters';
import { BIRIKIM_CATEGORY_ID } from '@/lib/categoryIcons';
import { colors } from '@/theme/tokens';

export default function SavingsScreen() {
  const sheetRef = useRef<ExpenseFormSheetRef>(null);
  const { year, month } = usePeriod();
  const { data, isLoading, isFetching, refetch } = useGetExpensesQuery({ year, month: month ?? undefined });

  const savings = useMemo(
    () =>
      (data ?? [])
        .filter((e) => e.category_id === BIRIKIM_CATEGORY_ID)
        .sort((a, b) => b.expense_date.localeCompare(a.expense_date)),
    [data],
  );
  const total = useMemo(() => savings.reduce((sum, e) => sum + displayAmount(e), 0), [savings]);

  const header = (
    <View>
      <View className="mb-4 rounded-2xl bg-emerald p-4">
        <Text className="text-sm font-medium text-white/80">Toplam birikim</Text>
        <Text className="mt-1 text-3xl font-bold text-white" style={{ fontVariant: ['tabular-nums'] }}>
          {formatCurrency(total)} ₺
        </Text>
        <Text className="mt-1 text-sm text-white/80">{savings.length} kayıt</Text>
      </View>
      <PeriodBar />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {isLoading ? (
        <View className="flex-1 px-4 pt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={savings}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => (
            <ExpenseCard expense={item} onPress={(e) => sheetRef.current?.present(e)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState message="Bu dönemde birikim yok." icon={PiggyBank} />}
          refreshing={isFetching}
          onRefresh={refetch}
        />
      )}

      <Pressable
        onPress={() => sheetRef.current?.present()}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-emerald active:opacity-80"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <Icon icon={Plus} size={26} color={colors.white} />
      </Pressable>

      <ExpenseFormSheet
        ref={sheetRef}
        forcedCategoryId={BIRIKIM_CATEGORY_ID}
        labels={{ create: 'Yeni birikim', edit: 'Birikimi düzenle' }}
      />
    </SafeAreaView>
  );
}
