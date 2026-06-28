import { RecurringCard } from "@/components/recurring/RecurringCard";
import {
  RecurringFormSheet,
  type RecurringFormSheetRef,
} from "@/components/recurring/RecurringFormSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { haptics } from "@/lib/haptics";
import { useGetRecurringQuery } from "@/store/api";
import { colors } from "@/theme/tokens";
import { FlashList } from "@shopify/flash-list";
import { Plus, Repeat } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "@/i18n";

export default function RecurringScreen() {
  const { t } = useTranslation();
  const sheetRef = useRef<RecurringFormSheetRef>(null);
  const { data, isLoading, isError, refetch } = useGetRecurringQuery();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={[]}
    >
      {isLoading ? (
        <View className="flex-1 px-4 pt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={data ?? []}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => (
            <RecurringCard
              template={item}
              onPress={(t) => sheetRef.current?.present(t)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          ListHeaderComponent={
            <ScreenHeader
              title={t("recurring.headerTitle")}
              description={t("recurring.headerDesc")}
            />
          }
          ListEmptyComponent={
            isError && !(data ?? []).length ? (
              <ErrorState onRetry={refetch} />
            ) : (
              <EmptyState
                message={t("recurring.empty")}
                description={t("recurring.emptyDesc")}
                icon={Repeat}
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
        accessibilityLabel={t("a11y.addRecurring")}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full active:opacity-80"
        style={{
          backgroundColor: "#8b5cf6",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <Icon icon={Plus} size={26} color={colors.white} />
      </Pressable>

      <RecurringFormSheet ref={sheetRef} />
    </SafeAreaView>
  );
}
