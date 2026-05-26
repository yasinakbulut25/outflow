import { View, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mt-3">
      <Text variant="h2" className="mb-3">{title}</Text>
      {children}
    </Card>
  );
}

export default function AnalyticsScreen() {
  const { year, prevYear, nextYear } = usePeriod();
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
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={prevYear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Önceki yıl"
          className="p-1 active:opacity-60"
        >
          <Icon icon={ChevronLeft} size={22} color={colors.foreground} />
        </Pressable>
        <Text variant="h1">{year}</Text>
        <Pressable
          onPress={nextYear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Sonraki yıl"
          className="p-1 active:opacity-60"
        >
          <Icon icon={ChevronRight} size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="mt-3">
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
          <View className="mt-3">
            <SummaryCards summary={data!.year_summary} />
          </View>
          <Section title="Aylık Gelir / Gider">
            <MonthlyBars data={data!.monthly_net} />
          </Section>
          <Section title="Kategoriler">
            <CategoryBreakdown data={data!.category_totals} />
          </Section>
          <Section title="Aylık Net">
            <NetList data={data!.monthly_net} />
          </Section>
        </>
      )}
    </Screen>
  );
}
