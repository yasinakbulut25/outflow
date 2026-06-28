import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { YearStepper } from "@/components/ui/YearStepper";
import { usePeriod } from "@/hooks/usePeriod";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useStableData } from "@/hooks/useStableData";
import { groupExpensesByMonthAndDay } from "@/lib/groupExpenses";
import { useGetExpensesQuery } from "@/store/api";
import type { Expense } from "@/types";
import { FlashList } from "@shopify/flash-list";
import { Wallet } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { RefreshControl, View } from "react-native";
import { MonthGroup } from "./MonthGroup";
import { useTranslation } from "@/i18n";
import { PeriodBar } from "./PeriodBar";

export function ExpenseList({
  onPressExpense,
  onPressSaving,
  onPressRecurring,
}: {
  onPressExpense?: (e: Expense) => void;
  onPressSaving?: (e: Expense) => void;
  onPressRecurring?: (templateId: number) => void;
}) {
  const { t } = useTranslation();
  const { year, month } = usePeriod();
  // Tekrarlayan ödemeler artık backend'de şablondan türetiliyor (projected:true ile);
  // hem ay hem "Tümü" görünümünde API verisi doğrudan kullanılır.
  const {
    data: raw,
    isError,
    refetch,
  } = useGetExpensesQuery(
    { year, month: month ?? undefined },
    { refetchOnMountOrArgChange: true },
  );
  // Dönem değişiminde önceki veriyi koru → liste iskelete çökmez, layout zıplamaz.
  const data = useStableData(raw);
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const groups = useMemo(() => groupExpensesByMonthAndDay(data ?? []), [data]);

  // Açılışta cari ayı aç (yoksa en güncel grubu) — planlanan gelecek aylar değil.
  const expandKey = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (groups.some((g) => g.monthKey === todayKey)) return todayKey;
    return groups[0]?.monthKey;
  }, [groups]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof groups)[number] }) => (
      <MonthGroup
        group={item}
        defaultExpanded={item.monthKey === expandKey}
        onPressExpense={onPressExpense}
        onPressSaving={onPressSaving}
        onPressRecurring={onPressRecurring}
      />
    ),
    [onPressExpense, onPressSaving, onPressRecurring, expandKey],
  );

  const listHeader = (
    <>
      <ScreenHeader
        title={t("expenses.headerTitle")}
        description={t("expenses.headerDesc")}
        right={<YearStepper />}
      />
      <PeriodBar />
    </>
  );

  if (data === undefined) {
    return (
      <View className="flex-1 px-4 pt-4">
        {listHeader}
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
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
      }}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        isError && !groups.length ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <EmptyState
            message={t("expenses.empty")}
            description={t("expenses.emptyDesc")}
            icon={Wallet}
          />
        )
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}
