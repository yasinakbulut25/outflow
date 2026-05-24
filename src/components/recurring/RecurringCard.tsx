import { View, Pressable } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { categoryIcon } from '@/lib/categoryIcons';
import { formatCurrency } from '@/lib/formatters';
import type { RecurringTemplate } from '@/types';

export function RecurringCard({
  template,
  onPress,
}: {
  template: RecurringTemplate;
  onPress?: (t: RecurringTemplate) => void;
}) {
  const { Icon: CatIcon, color } = categoryIcon(template.category_id);

  return (
    <Pressable onPress={() => onPress?.(template)} className="active:opacity-70">
      <Card className="mb-2">
        <View className="flex-row items-center gap-3">
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: color + '1a' }}
          >
            <Icon icon={CatIcon} size={18} color={color} />
          </View>

          <View className="flex-1">
            <Text variant="body" className="font-medium" numberOfLines={1}>
              {template.title}
            </Text>
            <Text variant="muted">Her ayın {template.day_of_month}. günü</Text>
          </View>

          <View className="items-end gap-1">
            <Text variant="mono">{formatCurrency(template.amount)} ₺</Text>
            {!template.active ? <Badge label="Pasif" tone="neutral" /> : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
