import { View } from 'react-native';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { getMonthName, formatCurrency } from '@/lib/formatters';
import type { MonthlyNet } from '@/types';

const TEAL = '#0d9488';
const RED = '#ef4444';

function monthNo(m: string): number {
  return Number(m.slice(5, 7));
}

// Aylık net — pozitif yeşil, negatif kırmızı.
export function NetList({ data }: { data: MonthlyNet[] }) {
  const rows = data.filter((d) => d.income > 0 || d.expense > 0);
  if (!rows.length) return <Text variant="muted" className="py-2">Veri yok.</Text>;

  return (
    <View className="gap-2">
      {rows.map((d, i) => {
        const positive = d.net >= 0;
        const color = positive ? TEAL : RED;
        return (
          <View
            key={d.month}
            className={cnRow(i === rows.length - 1)}
          >
            <Text variant="body" className="w-20 capitalize">{getMonthName(monthNo(d.month))}</Text>
            <View className="flex-1 flex-row items-center gap-3">
              <View className="flex-row items-center gap-0.5">
                <Icon icon={ArrowUpRight} size={13} color={TEAL} />
                <Text className="text-xs" style={{ color: TEAL }} numberOfLines={1}>{formatCurrency(d.income)}</Text>
              </View>
              <View className="flex-row items-center gap-0.5">
                <Icon icon={ArrowDownRight} size={13} color={RED} />
                <Text className="text-xs" style={{ color: RED }} numberOfLines={1}>{formatCurrency(d.expense)}</Text>
              </View>
            </View>
            <View className="rounded-full px-2 py-1" style={{ backgroundColor: color + '14' }}>
              <Text variant="mono" className="text-xs font-semibold" style={{ color }} numberOfLines={1}>
                {positive ? '' : '−'}{formatCurrency(Math.abs(d.net))} ₺
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function cnRow(isLast: boolean): string {
  return `flex-row items-center gap-2 pb-2${isLast ? '' : ' border-b border-border'}`;
}
