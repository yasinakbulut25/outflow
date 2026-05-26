import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { getMonthName, formatCurrency } from '@/lib/formatters';
import type { MonthlyNet } from '@/types';

const TEAL = '#0d9488';
const RED = '#ef4444';

function monthNo(m: string): number {
  return Number(m.slice(5, 7));
}

// Aylık gelir vs gider — orantılı yatay barlar (chart kütüphanesi yok).
export function MonthlyBars({ data }: { data: MonthlyNet[] }) {
  const rows = data.filter((d) => d.income > 0 || d.expense > 0);
  if (!rows.length) return <Text variant="muted" className="py-2">Veri yok.</Text>;

  const max = Math.max(...rows.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TEAL }} />
          <Text variant="muted">Gelir</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RED }} />
          <Text variant="muted">Gider</Text>
        </View>
      </View>

      {rows.map((d) => (
        <View key={d.month} className="gap-1">
          <Text variant="muted" className="text-xs">{getMonthName(monthNo(d.month))}</Text>
          <View className="gap-1">
            <View className="h-4 flex-row items-center">
              <View
                className="h-2.5 rounded-r-full"
                style={{ width: `${(d.income / max) * 100}%`, backgroundColor: TEAL, minWidth: d.income > 0 ? 4 : 0 }}
              />
              {d.income > 0 ? (
                <Text variant="muted" className="ml-1.5 text-xs">{formatCurrency(d.income)}</Text>
              ) : null}
            </View>
            <View className="h-4 flex-row items-center">
              <View
                className="h-2.5 rounded-r-full"
                style={{ width: `${(d.expense / max) * 100}%`, backgroundColor: RED, minWidth: d.expense > 0 ? 4 : 0 }}
              />
              {d.expense > 0 ? (
                <Text variant="muted" className="ml-1.5 text-xs">{formatCurrency(d.expense)}</Text>
              ) : null}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
