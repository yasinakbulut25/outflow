import { useMemo, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { Plus, TrendingUp } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { YearStepper } from '@/components/ui/YearStepper';
import { PeriodBar } from '@/components/expenses/PeriodBar';
import { IncomeCard } from '@/components/income/IncomeCard';
import { IncomeFormSheet, type IncomeFormSheetRef } from '@/components/income/IncomeFormSheet';
import { useGetIncomesQuery, useGetRecurringIncomesQuery } from '@/store/api';
import { usePeriod } from '@/hooks/usePeriod';
import { haptics } from '@/lib/haptics';
import { formatCurrency } from '@/lib/formatters';
import { colors } from '@/theme/tokens';
import type { Income } from '@/types';

const TEAL = '#16a34a';

export default function IncomeScreen() {
  const sheet = useRef<IncomeFormSheetRef>(null);
  const { year, month } = usePeriod();

  const incomes = useGetIncomesQuery(
    { year, month: month ?? undefined },
    { refetchOnMountOrArgChange: true },
  );
  // Düzenli gelir occurrence'ına dokununca şablonu açabilmek için şablon listesi.
  const templates = useGetRecurringIncomesQuery();

  const list = incomes.data ?? [];
  const total = useMemo(() => list.reduce((sum, i) => sum + i.amount, 0), [list]);

  const onPressIncome = (income: Income) => {
    if (income.recurring_income_id) {
      const tpl = templates.data?.find((t) => t.id === income.recurring_income_id);
      if (tpl) sheet.current?.present({ template: tpl });
    } else {
      sheet.current?.present({ income });
    }
  };

  const onRefresh = () => {
    incomes.refetch();
    templates.refetch();
  };

  return (
    <View className="flex-1">
      <Screen scroll refreshing={incomes.isFetching || templates.isFetching} onRefresh={onRefresh}>
        <ScreenHeader title="Gelirler" description="Tekrarlayan ve tek seferlik gelirlerini yönet." right={<YearStepper />} />

        <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: TEAL }}>
          <Text className="text-sm font-medium text-white/80">Toplam gelir</Text>
          <Text className="mt-1 text-3xl font-bold text-white" style={{ fontVariant: ['tabular-nums'] }}>
            {formatCurrency(total)} ₺
          </Text>
          <Text className="mt-1 text-sm text-white/80">{list.length} kayıt</Text>
        </View>

        <PeriodBar />

        <View className="mt-3">
          {incomes.isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : incomes.isError && !list.length ? (
            <ErrorState onRetry={incomes.refetch} />
          ) : list.length ? (
            list.map((i) => <IncomeCard key={i.id} income={i} onPress={onPressIncome} />)
          ) : (
            <EmptyState message="Bu dönemde gelir yok." icon={TrendingUp} />
          )}
        </View>
      </Screen>

      <Pressable
        onPress={() => {
          haptics.light();
          sheet.current?.present();
        }}
        accessibilityRole="button"
        accessibilityLabel="Yeni gelir ekle"
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full active:opacity-80"
        style={{
          backgroundColor: TEAL,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <Icon icon={Plus} size={26} color={colors.white} />
      </Pressable>

      <IncomeFormSheet ref={sheet} />
    </View>
  );
}
