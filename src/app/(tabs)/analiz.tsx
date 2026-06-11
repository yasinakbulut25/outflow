import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";
import { MonthlyBars } from "@/components/analytics/MonthlyBars";
import { NetList } from "@/components/analytics/NetList";
import { SummaryCards } from "@/components/analytics/SummaryCards";
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
import { useGetAnalyticsQuery } from "@/store/api";
import { colors } from "@/theme/tokens";
import { BarChart3, PieChart, Scale } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconComponent;
  children: ReactNode;
}) {
  return (
    <Card className="mt-3">
      <View className="mb-3 flex-row items-center gap-2">
        <Icon icon={icon} size={18} color={colors.muted} />
        <Text variant="h2">{title}</Text>
      </View>
      {children}
    </Card>
  );
}

export default function AnalyticsScreen() {
  const { year } = usePeriod();
  const {
    data: raw,
    isError,
    refetch,
  } = useGetAnalyticsQuery(year, {
    refetchOnMountOrArgChange: true,
  });
  // Yıl değişiminde önceki veriyi koru → layout zıplamaz.
  const data = useStableData(raw);
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const hasData =
    !!data &&
    (data.year_summary.total_income > 0 ||
      data.year_summary.total_expense > 0 ||
      data.category_totals.length > 0);

  return (
    <Screen scroll safeTop={false} refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader
        title="Analiz"
        description="Yıllık gelir, gider ve kategori dağılımının özeti."
        right={<YearStepper />}
      />

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
          message="Bu yıl için analiz verisi yok"
          description="Gelir ve gider ekledikçe aylık özet, kategori dağılımı ve net durum burada görünür."
        />
      ) : (
        <>
          <SummaryCards summary={data!.year_summary} />
          <Section title="Aylık Gelir / Gider" icon={BarChart3}>
            <MonthlyBars data={data!.monthly_net} />
          </Section>
          <Section title="Kategoriler" icon={PieChart}>
            <CategoryBreakdown data={data!.category_totals} />
          </Section>
          <Section title="Aylık Net" icon={Scale}>
            <NetList data={data!.monthly_net} />
          </Section>
        </>
      )}
    </Screen>
  );
}
