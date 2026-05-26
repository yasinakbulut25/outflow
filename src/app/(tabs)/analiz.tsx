import type { ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight, BarChart3, PieChart, Scale } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Icon, type IconComponent } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
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

function YearStepper({ year, onPrev, onNext }: { year: number; onPrev: () => void; onNext: () => void }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full border border-border bg-white p-1">
      <Pressable onPress={onPrev} hitSlop={6} accessibilityRole="button" accessibilityLabel="Önceki yıl" className="p-1 active:opacity-60">
        <Icon icon={ChevronLeft} size={18} color={colors.foreground} />
      </Pressable>
      <Text variant="h2" className="px-1 text-base">{year}</Text>
      <Pressable onPress={onNext} hitSlop={6} accessibilityRole="button" accessibilityLabel="Sonraki yıl" className="p-1 active:opacity-60">
        <Icon icon={ChevronRight} size={18} color={colors.foreground} />
      </Pressable>
    </View>
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
      <ScreenHeader
        title="Analiz"
        description="Yıllık gelir, gider ve kategori dağılımının özeti."
        right={<YearStepper year={year} onPrev={prevYear} onNext={nextYear} />}
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
