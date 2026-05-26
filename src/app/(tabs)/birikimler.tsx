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
import { usePeriod } from "@/hooks/usePeriod";
import { BIRIKIM_CATEGORY_ID } from "@/lib/categoryIcons";
import { formatCurrency } from "@/lib/formatters";
import { displayAmount } from "@/lib/groupExpenses";
import { haptics } from "@/lib/haptics";
import { useGetExpensesQuery } from "@/store/api";
import { colors } from "@/theme/tokens";
import { FlashList } from "@shopify/flash-list";
import { HandCoins, Plus } from "lucide-react-native";
import { useMemo, useRef } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavingsScreen() {
  const sheetRef = useRef<SavingsFormSheetRef>(null);
  const { year, month } = usePeriod();
  const { data, isLoading, isError, isFetching, refetch } = useGetExpensesQuery(
    { year, month: month ?? undefined },
    { refetchOnMountOrArgChange: true },
  );

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
        title="Birikimler"
        description="Altın, döviz, nakit; neyi ne kadar biriktirdiğini takip et."
      />
      <View className="mb-4 rounded-2xl bg-emerald p-4">
        <Text className="text-sm font-medium text-white/80">
          Toplam birikim
        </Text>
        <Text
          className="mt-1 text-3xl font-bold text-white"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatCurrency(total)} ₺
        </Text>
        <Text className="mt-1 text-sm text-white/80">
          {savings.length} kayıt
        </Text>
      </View>
      <PeriodBar />
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
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
              <EmptyState message="Bu dönemde birikim yok." icon={HandCoins} />
            )
          }
          refreshing={isFetching}
          onRefresh={refetch}
        />
      )}

      <Pressable
        onPress={() => {
          haptics.light();
          sheetRef.current?.present();
        }}
        accessibilityRole="button"
        accessibilityLabel="Yeni birikim ekle"
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-emerald active:opacity-80"
        style={{
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
