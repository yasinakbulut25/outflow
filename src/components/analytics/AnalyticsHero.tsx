import { View } from 'react-native';
import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon, type IconComponent } from '@/components/ui/Icon';
import { useTranslation, useFormat } from '@/i18n';
import { colors } from '@/theme/tokens';

const TEAL = '#16a34a';
const RED = '#ef4444';

export interface PeriodSummary {
  /** Dönem etiketi, örn. "Haziran 2026" ya da "2026 yılı". */
  label: string;
  income: number;
  expense: number;
  net: number;
  /** Aylık modda gider'in geçen aya göre % değişimi (yoksa null). */
  expenseDelta?: number | null;
  /** Yıllık modda ek istatistik (örn. aylık ortalama gider). */
  secondary?: { label: string; value: number } | null;
}

function StatCard({
  label,
  value,
  color,
  icon,
  negative = false,
}: {
  label: string;
  value: number;
  color: string;
  icon: IconComponent;
  negative?: boolean;
}) {
  const fmt = useFormat();
  return (
    <View className="flex-1 rounded-2xl border border-border bg-white p-3">
      <View className="mb-2 h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: color + '1a' }}>
        <Icon icon={icon} size={16} color={color} />
      </View>
      <Text variant="muted" className="text-xs">{label}</Text>
      <Text variant="mono" className="mt-0.5 text-lg font-bold" style={{ color }} numberOfLines={1}>
        {negative ? fmt.moneySigned(value) : fmt.money(value)}
      </Text>
    </View>
  );
}

export function AnalyticsHero({ label, income, expense, net, expenseDelta, secondary }: PeriodSummary) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const positive = net >= 0;
  const empty = income === 0 && expense === 0;
  const netColor = empty ? colors.muted : positive ? TEAL : RED;
  // Tasarruf oranı yalnız gelir varken ve pozitifken anlamlı (kalan / gelir).
  const savingsRate = income > 0 && net >= 0 ? (net / income) * 100 : null;
  const caption = empty
    ? t("analytics.noActivity")
    : net === 0
      ? t("analytics.equal")
      : positive
        ? t("analytics.incomeMore")
        : t("analytics.expenseMore");

  const deltaIcon = expenseDelta == null ? Minus : expenseDelta > 0 ? ArrowUp : expenseDelta < 0 ? ArrowDown : Minus;

  return (
    <View className="gap-2">
      <View className="overflow-hidden rounded-2xl p-4" style={{ backgroundColor: netColor }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-sm font-medium text-white/80">{t("analytics.net")} · {label}</Text>
            <Text
              className="mt-1 text-3xl font-bold text-white"
              style={{ fontVariant: ['tabular-nums'] }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {positive ? '' : '−'}{fmt.money(Math.abs(net))}
            </Text>
            <Text className="mt-1 text-xs text-white/80">{caption}</Text>
          </View>

          {expenseDelta != null ? (
            <View className="items-end gap-1">
              <View className="flex-row items-center gap-0.5 rounded-full bg-white/20 px-2 py-1">
                <Icon icon={deltaIcon} size={13} color="#ffffff" />
                <Text className="text-xs font-semibold text-white">%{Math.abs(Math.round(expenseDelta))}</Text>
              </View>
              <Text className="text-[10px] text-white/70">{t("analytics.expenseVsLastMonth")}</Text>
            </View>
          ) : null}
        </View>

        {savingsRate != null ? (
          <View className="mt-3 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-white/80">{t("analytics.savingsRate")}</Text>
              <Text className="text-xs font-semibold text-white">%{Math.round(savingsRate)}</Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-white/25">
              <View className="h-1.5 rounded-full bg-white/90" style={{ width: `${Math.min(100, savingsRate)}%` }} />
            </View>
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <StatCard label={t("analytics.income")} value={income} color={TEAL} icon={TrendingUp} />
        <StatCard label={t("analytics.expense")} value={expense} color={RED} icon={TrendingDown} negative />
      </View>

      {secondary ? (
        <View className="flex-row items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
          <Text variant="muted" className="text-sm">{secondary.label}</Text>
          <Text variant="mono" className="font-semibold text-foreground">{fmt.moneySigned(secondary.value)}</Text>
        </View>
      ) : null}
    </View>
  );
}
