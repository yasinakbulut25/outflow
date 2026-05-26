import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { getMonthName } from '@/lib/formatters';
import type { MonthlyNet } from '@/types';

const TEAL = '#0d9488';
const RED = '#ef4444';

function monthNo(m: string): number {
  return Number(m.slice(5, 7));
}

// Kısa para etiketi (taşmayı önler): 1.250.000 → 1,3M, 12.500 → 12,5B.
function compact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace('.', ',')}B`;
  return String(Math.round(v));
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <View className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: color + '14' }}>
      <View className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </View>
  );
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
          <Text variant="muted" className="text-xs">Gelir</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RED }} />
          <Text variant="muted" className="text-xs">Gider</Text>
        </View>
      </View>

      {rows.map((d) => (
        <View key={d.month} className="flex-row items-center gap-2">
          <Text variant="muted" className="w-8 text-xs">{getMonthName(monthNo(d.month)).slice(0, 3)}</Text>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <Bar value={d.income} max={max} color={TEAL} />
              <Text className="w-12 text-right text-xs" style={{ color: TEAL }} numberOfLines={1}>
                {compact(d.income)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Bar value={d.expense} max={max} color={RED} />
              <Text className="w-12 text-right text-xs" style={{ color: RED }} numberOfLines={1}>
                {compact(d.expense)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
