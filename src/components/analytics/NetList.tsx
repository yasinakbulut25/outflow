import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
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
      {rows.map((d) => {
        const positive = d.net >= 0;
        return (
          <View key={d.month} className="flex-row items-center border-b border-border py-2">
            <Text variant="body" className="w-24 capitalize">{getMonthName(monthNo(d.month))}</Text>
            <View className="flex-1 flex-row gap-3">
              <Text variant="muted" className="text-xs">+{formatCurrency(d.income)}</Text>
              <Text variant="muted" className="text-xs">−{formatCurrency(d.expense)}</Text>
            </View>
            <Text variant="mono" className="font-semibold" style={{ color: positive ? TEAL : RED }}>
              {positive ? '' : '−'}{formatCurrency(Math.abs(d.net))} ₺
            </Text>
          </View>
        );
      })}
    </View>
  );
}
