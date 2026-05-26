import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { formatCurrency } from '@/lib/formatters';
import type { CategoryTotal } from '@/types';

// Kategoriye göre gider dağılımı — renkli orantı barları.
export function CategoryBreakdown({ data }: { data: CategoryTotal[] }) {
  const rows = data.filter((c) => c.total > 0);
  if (!rows.length) return <Text variant="muted" className="py-2">Veri yok.</Text>;

  const total = rows.reduce((s, c) => s + c.total, 0);
  const max = Math.max(...rows.map((c) => c.total), 1);

  return (
    <View className="gap-3.5">
      {rows.map((c) => {
        const pct = total > 0 ? (c.total / total) * 100 : 0;
        const barPct = (c.total / max) * 100;
        return (
          <View key={c.name} className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              <Text variant="body" className="flex-1 text-sm" numberOfLines={1}>{c.name}</Text>
              <Text variant="mono" className="text-sm" numberOfLines={1}>{formatCurrency(c.total)} ₺</Text>
              <View className="w-11 items-end">
                <View className="rounded-full bg-surface px-1.5 py-0.5">
                  <Text variant="muted" className="text-[11px]">%{Math.round(pct)}</Text>
                </View>
              </View>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-surface">
              <View className="h-2 rounded-full" style={{ width: `${barPct}%`, backgroundColor: c.color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
