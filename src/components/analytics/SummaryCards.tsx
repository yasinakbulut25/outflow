import { View } from 'react-native';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { formatCurrency, formatExpense } from '@/lib/formatters';

const TEAL = '#16a34a';
const RED = '#ef4444';

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
  icon: typeof TrendingUp;
  negative?: boolean;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-white p-3">
      <View className="mb-2 h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: color + '1a' }}>
        <Icon icon={icon} size={16} color={color} />
      </View>
      <Text variant="muted" className="text-xs">{label}</Text>
      <Text variant="mono" className="mt-0.5 text-lg font-bold" style={{ color }} numberOfLines={1}>
        {negative ? formatExpense(value) : formatCurrency(value)} ₺
      </Text>
    </View>
  );
}

export function SummaryCards({
  summary,
}: {
  summary: { total_income: number; total_expense: number; net: number };
}) {
  const positive = summary.net >= 0;
  const netColor = positive ? TEAL : RED;

  return (
    <View className="gap-2">
      <View
        className="overflow-hidden rounded-2xl p-4"
        style={{ backgroundColor: netColor }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm font-medium text-white/80">Net Durum</Text>
            <Text
              className="mt-1 text-3xl font-bold text-white"
              style={{ fontVariant: ['tabular-nums'] }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {positive ? '' : '−'}{formatCurrency(Math.abs(summary.net))} ₺
            </Text>
            <Text className="mt-1 text-xs text-white/80">
              {positive ? 'Gelir giderden fazla' : 'Gider gelirden fazla'}
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Icon icon={Wallet} size={24} color="#ffffff" />
          </View>
        </View>
      </View>

      <View className="flex-row gap-2">
        <StatCard label="Toplam Gelir" value={summary.total_income} color={TEAL} icon={TrendingUp} />
        <StatCard label="Toplam Gider" value={summary.total_expense} color={RED} icon={TrendingDown} negative />
      </View>
    </View>
  );
}
