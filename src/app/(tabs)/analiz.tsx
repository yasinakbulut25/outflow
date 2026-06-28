import { AnalyticsHero, type PeriodSummary } from "@/components/analytics/AnalyticsHero";
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";
import { MonthlyBars } from "@/components/analytics/MonthlyBars";
import { NetList } from "@/components/analytics/NetList";
import { PeriodBar } from "@/components/expenses/PeriodBar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon, type IconComponent } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Text } from "@/components/ui/Text";
import { YearStepper } from "@/components/ui/YearStepper";
import { usePeriod } from "@/hooks/usePeriod";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useStableData } from "@/hooks/useStableData";
import { BIRIKIM_CATEGORY_ID, categoryIcon } from "@/lib/categoryIcons";
import { displayAmount } from "@/lib/groupExpenses";
import { useGetAnalyticsQuery, useGetExpensesQuery } from "@/store/api";
import { colors } from "@/theme/tokens";
import type { Expense } from "@/types";
import { useTranslation, useFormat, useCategoryName } from "@/i18n";
import { BarChart3, PieChart, Scale } from "lucide-react-native";
import { useCallback, useMemo, type ReactNode } from "react";
import { View } from "react-native";

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: IconComponent;
  children: ReactNode;
}) {
  return (
    <Card className="mt-3">
      <View className="mb-3 flex-row items-center gap-2">
        <Icon icon={icon} size={18} color={colors.muted} />
        <View className="flex-1">
          <Text variant="h2">{title}</Text>
          {subtitle ? <Text variant="muted" className="text-xs">{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

// Dönem harcamalarını kategoriye göre toplar (gider listesiyle aynı mantık:
// taksitte aylık pay, birikim hariç). İsim render anında id'den (dile göre) çözülür.
function categoryTotalsFromExpenses(
  expenses: Expense[],
): { id: number; color: string; total: number }[] {
  const map = new Map<number, number>();
  for (const e of expenses) {
    if (e.category_id === BIRIKIM_CATEGORY_ID) continue; // birikim gider değil
    const id = e.category_id ?? 0;
    map.set(id, (map.get(id) ?? 0) + displayAmount(e));
  }
  return [...map.entries()]
    .map(([id, total]) => ({ id, color: categoryIcon(id).color, total }))
    .sort((a, b) => b.total - a.total);
}

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const catName = useCategoryName();
  const { year, month } = usePeriod();
  const isMonthly = month !== null;

  const {
    data: rawAnalytics,
    isError,
    refetch: refetchAnalytics,
  } = useGetAnalyticsQuery(year, { refetchOnMountOrArgChange: true });
  const data = useStableData(rawAnalytics);

  // Kategori dağılımı dönem harcamalarından hesaplanır → seçili ay/yıl ile birebir tutarlı.
  const { data: rawExpenses, refetch: refetchExpenses } = useGetExpensesQuery(
    { year, month: month ?? undefined },
    { refetchOnMountOrArgChange: true },
  );
  const expenses = useStableData(rawExpenses);

  const refetch = useCallback(
    () => Promise.all([refetchAnalytics(), refetchExpenses()]),
    [refetchAnalytics, refetchExpenses],
  );
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const summary = useMemo<PeriodSummary | null>(() => {
    if (!data) return null;
    if (!isMonthly) {
      const s = data.year_summary;
      const activeMonths = data.monthly_net.filter((m) => m.income > 0 || m.expense > 0).length || 1;
      return {
        label: t("analytics.yearLabel", { year }),
        income: s.total_income,
        expense: s.total_expense,
        net: s.net,
        secondary: { label: t("analytics.monthlyAvgExpense"), value: s.total_expense / activeMonths },
      };
    }
    const cur = data.monthly_net.find((m) => Number(m.month.slice(5, 7)) === month);
    const prev = data.monthly_net.find((m) => Number(m.month.slice(5, 7)) === month - 1);
    const income = cur?.income ?? 0;
    const expense = cur?.expense ?? 0;
    const expenseDelta =
      prev && prev.expense > 0 ? ((expense - prev.expense) / prev.expense) * 100 : null;
    return {
      label: `${fmt.monthName(month)} ${year}`,
      income,
      expense,
      net: cur?.net ?? income - expense,
      expenseDelta,
    };
  }, [data, isMonthly, month, year, fmt, t]);

  const categoryTotals = useMemo(
    () =>
      categoryTotalsFromExpenses(expenses ?? []).map((c) => ({
        name: catName(c.id),
        icon: "",
        color: c.color,
        total: c.total,
      })),
    [expenses, catName],
  );

  const hasData =
    !!data &&
    (data.year_summary.total_income > 0 ||
      data.year_summary.total_expense > 0 ||
      data.category_totals.length > 0);

  const periodLabel = isMonthly
    ? `${fmt.monthName(month)} ${year}`
    : t("analytics.yearOverall", { year });

  return (
    <Screen scroll safeTop={false} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader
        title={t("analytics.headerTitle")}
        description={t("analytics.headerDesc")}
        right={<YearStepper />}
      />
      <PeriodBar />

      {data === undefined ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError && !data ? (
        <ErrorState onRetry={refetch} />
      ) : !hasData ? (
        <EmptyState
          message={t("analytics.empty")}
          description={t("analytics.emptyDesc")}
        />
      ) : (
        <>
          {summary ? <AnalyticsHero {...summary} /> : null}

          <Section
            title={t("analytics.categories")}
            subtitle={t("analytics.categoriesSub", { period: periodLabel })}
            icon={PieChart}
          >
            <CategoryBreakdown data={categoryTotals} />
          </Section>

          <Section
            title={t("analytics.monthlyIncomeExpense")}
            subtitle={t("analytics.trendOverYear")}
            icon={BarChart3}
          >
            <MonthlyBars data={data!.monthly_net} />
          </Section>

          <Section title={t("analytics.monthlyNet")} subtitle={t("analytics.overYear")} icon={Scale}>
            <NetList data={data!.monthly_net} />
          </Section>
        </>
      )}
    </Screen>
  );
}
