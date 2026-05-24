import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { formatCurrency } from '@/lib/formatters';
import type { ExpenseItem } from '@/types';

// Harcama kalemleri (birden fazla kalem varsa gösterilir).
export function ExpenseItems({ items }: { items: ExpenseItem[] }) {
  if (!items || items.length < 2) return null;
  return (
    <View className="mt-2 gap-1 border-t border-border pt-2">
      {items.map((item, i) => (
        <View key={item.id ?? i} className="flex-row items-center justify-between">
          <Text variant="muted" className="flex-1" numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="mono" className="text-sm text-muted">
            {formatCurrency(item.amount)} ₺
          </Text>
        </View>
      ))}
    </View>
  );
}
