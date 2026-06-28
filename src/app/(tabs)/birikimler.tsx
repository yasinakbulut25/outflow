import { PeriodBar } from "@/components/expenses/PeriodBar";
import { SavingsCard } from "@/components/savings/SavingsCard";
import {
  SavingsFormSheet,
  type SavingsFormSheetRef,
} from "@/components/savings/SavingsFormSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Text } from "@/components/ui/Text";
import { YearStepper } from "@/components/ui/YearStepper";
import { usePeriod } from "@/hooks/usePeriod";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useStableData } from "@/hooks/useStableData";
import { BIRIKIM_CATEGORY_ID } from "@/lib/categoryIcons";
import { displayAmount } from "@/lib/groupExpenses";
import { useTranslation, useFormat } from "@/i18n";
import { haptics } from "@/lib/haptics";
import { useGetExpensesQuery } from "@/store/api";
import { colors } from "@/theme/tokens";
import { FlashList } from "@shopify/flash-list";
import { HandCoins, Plus } from "lucide-react-native";
import { useMemo, useRef } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#d97706"; // birikim teması (altın)

export default function SavingsScreen() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const sheetRef = useRef<SavingsFormSheetRef>(null);
  const { year, month } = usePeriod();
  const {
    data: raw,
    isError,
    refetch,
  } = useGetExpensesQuery(
    { year, month: month ?? undefined },
    { refetchOnMountOrArgChange: true },
  );
  // Dönem değişiminde önceki veriyi koru → layout zıplamaz.
  const data = useStableData(raw);
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const savings = useMemo(
    () =>
      (data ?? [])
        .filter((e) => e.category_id === BIRIKIM_CATEGORY_ID)
        .sort((a, b) => b.expense_date.localeCompare(a.expense_date)),
    [data],
  );
  const total = useMemo(
    () => savings.reduce((sum, e) => sum + displayAmount(e), 0),
    [savings],
  );

  const header = (
    <View>
      <ScreenHeader
        title={t("savings.headerTitle")}
        description={t("savings.headerDesc")}
        right={<YearStepper />}
      />
      <View className="mb-4 rounded-2xl p-4" style={{ backgroundColor: GOLD }}>
        <Text className="text-sm font-medium text-white/80">
          {t("savings.total")}
        </Text>
        <Text
          className="mt-1 text-3xl font-bold text-white"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {fmt.money(total)}
        </Text>
        <Text className="mt-1 text-sm text-white/80">
          {t("common.records", { count: savings.length })}
        </Text>
      </View>
      <PeriodBar />
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={[]}
    >
      {data === undefined ? (
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
            <SavingsCard
              saving={item}
              onPress={(e) => sheetRef.current?.present(e)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          ListHeaderComponent={header}
          ListEmptyComponent={
            isError && !savings.length ? (
              <ErrorState onRetry={refetch} />
            ) : (
              <EmptyState
                message={t("savings.empty")}
                description={t("savings.emptyDesc")}
                icon={HandCoins}
              />
            )
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      <Pressable
        onPress={() => {
          haptics.light();
          sheetRef.current?.present();
        }}
        accessibilityRole="button"
        accessibilityLabel={t("a11y.addSaving")}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full active:opacity-80"
        style={{
          backgroundColor: GOLD,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <Icon icon={Plus} size={26} color={colors.white} />
      </Pressable>

      <SavingsFormSheet ref={sheetRef} />
    </SafeAreaView>
  );
}
