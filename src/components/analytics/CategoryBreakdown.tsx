import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { formatCurrency } from '@/lib/formatters';
import type { CategoryTotal } from '@/types';

// Kategoriye göre gider dağılımı — renkli orantı barları.
export function CategoryBreakdown({ data }: { data: CategoryTotal[] }) {
  const rows = data.filter((c) => c.total > 0);
  if (!rows.length) return <Text variant="muted" className="py-2">Veri yok.</Text>;

  const total = rows.reduce((s, c) => s + c.total, 0);

  return (
    <View className="gap-3">
      {rows.map((c) => {
        const pct = total > 0 ? (c.total / total) * 100 : 0;
        return (
          <View key={c.name} className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
              <Text variant="body" className="flex-1" numberOfLines={1}>{c.name}</Text>
              <Text variant="mono" className="text-sm">{formatCurrency(c.total)} ₺</Text>
              <Text variant="muted" className="w-10 text-right text-xs">%{Math.round(pct)}</Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-surface">
              <View className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
