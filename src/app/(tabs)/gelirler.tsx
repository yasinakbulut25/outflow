import { useMemo, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { PeriodBar } from '@/components/expenses/PeriodBar';
import { IncomeCard } from '@/components/income/IncomeCard';
import { RecurringIncomeCard } from '@/components/income/RecurringIncomeCard';
import { IncomeFormSheet, type IncomeFormSheetRef } from '@/components/income/IncomeFormSheet';
import {
  RecurringIncomeFormSheet,
  type RecurringIncomeFormSheetRef,
} from '@/components/income/RecurringIncomeFormSheet';
import { useGetIncomesQuery, useGetRecurringIncomesQuery } from '@/store/api';
import { usePeriod } from '@/hooks/usePeriod';
import { formatCurrency } from '@/lib/formatters';

const TEAL = '#0d9488';

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <View className="mb-2 mt-4 flex-row items-center justify-between">
      <Text variant="h2">{title}</Text>
      <Pressable onPress={onAdd} className="flex-row items-center gap-1 active:opacity-60">
        <Icon icon={Plus} size={18} color={TEAL} />
        <Text className="text-sm font-medium" style={{ color: TEAL }}>Ekle</Text>
      </Pressable>
    </View>
  );
}

export default function IncomeScreen() {
  const incomeSheet = useRef<IncomeFormSheetRef>(null);
  const recurringSheet = useRef<RecurringIncomeFormSheetRef>(null);
  const { year, month } = usePeriod();

  const incomes = useGetIncomesQuery(
    { year, month: month ?? undefined },
    { refetchOnMountOrArgChange: true },
  );
  const templates = useGetRecurringIncomesQuery();

  const total = useMemo(
    () => (incomes.data ?? []).reduce((sum, i) => sum + i.amount, 0),
    [incomes.data],
  );

  const onRefresh = () => {
    incomes.refetch();
    templates.refetch();
  };

  return (
    <>
      <Screen scroll refreshing={incomes.isFetching || templates.isFetching} onRefresh={onRefresh}>
        <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: TEAL }}>
          <Text className="text-sm font-medium text-white/80">Toplam gelir</Text>
          <Text className="mt-1 text-3xl font-bold text-white" style={{ fontVariant: ['tabular-nums'] }}>
            {formatCurrency(total)} ₺
          </Text>
          <Text className="mt-1 text-sm text-white/80">{(incomes.data ?? []).length} kayıt</Text>
        </View>

        <PeriodBar />

        <SectionHeader title="Tekrarlayan Gelirler" onAdd={() => recurringSheet.current?.present()} />
        {templates.isLoading ? (
          <SkeletonCard />
        ) : (templates.data ?? []).length ? (
          (templates.data ?? []).map((t) => (
            <RecurringIncomeCard key={t.id} template={t} onPress={(tpl) => recurringSheet.current?.present(tpl)} />
          ))
        ) : (
          <Text variant="muted" className="py-2">Henüz tekrarlayan gelir yok.</Text>
        )}

        <SectionHeader title="Bu Dönemin Gelirleri" onAdd={() => incomeSheet.current?.present()} />
        {incomes.isLoading ? (
          <SkeletonCard />
        ) : (incomes.data ?? []).length ? (
          (incomes.data ?? []).map((i) => (
            <IncomeCard key={i.id} income={i} onPress={(inc) => incomeSheet.current?.present(inc)} />
          ))
        ) : (
          <Text variant="muted" className="py-2">Bu dönemde gelir yok.</Text>
        )}
      </Screen>

      <IncomeFormSheet ref={incomeSheet} />
      <RecurringIncomeFormSheet ref={recurringSheet} />
    </>
  );
}
