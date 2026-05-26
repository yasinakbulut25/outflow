import { View, Pressable } from 'react-native';
import { Repeat } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/formatters';
import type { RecurringIncomeTemplate } from '@/types';

const TEAL = '#0d9488';

export function RecurringIncomeCard({
  template,
  onPress,
}: {
  template: RecurringIncomeTemplate;
  onPress?: (t: RecurringIncomeTemplate) => void;
}) {
  return (
    <Pressable onPress={() => onPress?.(template)} className="active:opacity-70">
      <Card className="mb-2">
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: TEAL + '1a' }}>
            <Icon icon={Repeat} size={18} color={TEAL} />
          </View>

          <View className="flex-1">
            <Text variant="body" className="font-medium" numberOfLines={1}>{template.title}</Text>
            <Text variant="muted">Her ayın {template.day_of_month}. günü</Text>
          </View>

          <View className="items-end gap-1">
            <Text variant="mono" style={{ color: TEAL }}>{formatCurrency(template.amount)} ₺</Text>
            {!template.active ? <Badge label="Pasif" tone="neutral" /> : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
