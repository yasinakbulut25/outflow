import { PeriodBar } from "@/components/expenses/PeriodBar";
import { IncomeCard } from "@/components/income/IncomeCard";
import {
  IncomeFormSheet,
  type IncomeFormSheetRef,
} from "@/components/income/IncomeFormSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Text } from "@/components/ui/Text";
import { YearStepper } from "@/components/ui/YearStepper";
import { usePeriod } from "@/hooks/usePeriod";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useStableData } from "@/hooks/useStableData";
import { haptics } from "@/lib/haptics";
import { useGetIncomesQuery, useGetRecurringIncomesQuery } from "@/store/api";
import { colors } from "@/theme/tokens";
import type { Income } from "@/types";
import { useTranslation, useFormat } from "@/i18n";
import { Plus, TrendingUp } from "lucide-react-native";
import { useMemo, useRef } from "react";
import { Pressable, View } from "react-native";

const TEAL = "#16a34a";

export default function IncomeScreen() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const sheet = useRef<IncomeFormSheetRef>(null);
  const { year, month } = usePeriod();

  const incomes = useGetIncomesQuery(
    { year, month: month ?? undefined },
    { refetchOnMountOrArgChange: true },
  );
  // Düzenli gelir occurrence'ına dokununca şablonu açabilmek için şablon listesi.
  const templates = useGetRecurringIncomesQuery();

  // Dönem değişiminde önceki veriyi koru → liste iskelete çökmez, layout zıplamaz.
  const incomesData = useStableData(incomes.data);
  const list = incomesData ?? [];
  const total = useMemo(
    () => list.reduce((sum, i) => sum + i.amount, 0),
    [list],
  );

  const onPressIncome = (income: Income) => {
    if (income.recurring_income_id) {
      const tpl = templates.data?.find(
        (t) => t.id === income.recurring_income_id,
      );
      if (tpl) sheet.current?.present({ template: tpl });
    } else {
      sheet.current?.present({ income });
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh(() =>
    Promise.all([incomes.refetch(), templates.refetch()]),
  );

  return (
    <View className="flex-1">
      <Screen scroll safeTop={false} refreshing={refreshing} onRefresh={onRefresh}>
        <ScreenHeader
          title={t("income.headerTitle")}
          description={t("income.headerDesc")}
          right={<YearStepper />}
        />

        <View
          className="mb-4 rounded-2xl p-4"
          style={{ backgroundColor: TEAL }}
        >
          <Text className="text-sm font-medium text-white/80">
            {t("income.total")}
          </Text>
          <Text
            className="mt-1 text-3xl font-bold text-white"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {fmt.money(total)}
          </Text>
          <Text className="mt-1 text-sm text-white/80">
            {t("common.records", { count: list.length })}
          </Text>
        </View>

        <PeriodBar />

        <View className="mt-3">
          {incomesData === undefined ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : incomes.isError && !list.length ? (
            <ErrorState onRetry={incomes.refetch} />
          ) : list.length ? (
            list.map((i) => (
              <IncomeCard key={i.id} income={i} onPress={onPressIncome} />
            ))
          ) : (
            <EmptyState
              message={t("income.empty")}
              description={t("income.emptyDesc")}
              icon={TrendingUp}
            />
          )}
        </View>
      </Screen>

      <Pressable
        onPress={() => {
          haptics.light();
          sheet.current?.present();
        }}
        accessibilityRole="button"
        accessibilityLabel={t("a11y.addIncome")}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full active:opacity-80"
        style={{
          backgroundColor: TEAL,
          shadowColor: "#000",
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
