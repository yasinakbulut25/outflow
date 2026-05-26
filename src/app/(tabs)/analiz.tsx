import type { ReactNode } from 'react';
import { View } from 'react-native';
import { BarChart3, PieChart, Scale } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon, type IconComponent } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { YearStepper } from '@/components/ui/YearStepper';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { SummaryCards } from '@/components/analytics/SummaryCards';
import { MonthlyBars } from '@/components/analytics/MonthlyBars';
import { CategoryBreakdown } from '@/components/analytics/CategoryBreakdown';
import { NetList } from '@/components/analytics/NetList';
import { useGetAnalyticsQuery } from '@/store/api';
import { usePeriod } from '@/hooks/usePeriod';
import { colors } from '@/theme/tokens';

function Section({ title, icon, children }: { title: string; icon: IconComponent; children: ReactNode }) {
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
  const { data, isLoading, isError, isFetching, refetch } = useGetAnalyticsQuery(year, {
    refetchOnMountOrArgChange: true,
  });

  const hasData =
    !!data &&
    (data.year_summary.total_income > 0 ||
      data.year_summary.total_expense > 0 ||
      data.category_totals.length > 0);

  return (
    <Screen scroll refreshing={isFetching} onRefresh={refetch}>
      <ScreenHeader
        title="Analiz"
        description="Yıllık gelir, gider ve kategori dağılımının özeti."
        right={<YearStepper />}
      />

      {isLoading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError && !data ? (
        <ErrorState onRetry={refetch} />
      ) : !hasData ? (
        <EmptyState message="Bu yıl için analiz verisi yok." />
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
