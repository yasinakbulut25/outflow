import { View, Pressable } from 'react-native';
import { HandCoins } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { useFormat } from '@/i18n';
import type { Expense } from '@/types';

const EMERALD = '#d97706';

// Birikim kartı: ne (title) + ne kadar (note/miktar) öne çıkar; ₺ değeri varsa altta.
export function SavingsCard({ saving, onPress }: { saving: Expense; onPress?: (e: Expense) => void }) {
  const fmt = useFormat();
  const quantity = saving.note?.trim();
  const hasValue = saving.total_amount > 0;

  return (
    <Pressable onPress={() => onPress?.(saving)} className="active:opacity-70">
      <Card className="mb-2">
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: EMERALD + '1a' }}>
            <Icon icon={HandCoins} size={18} color={EMERALD} />
          </View>

          <View className="flex-1">
            <Text variant="body" className="font-medium" numberOfLines={1}>{saving.title}</Text>
            <Text variant="muted" className="capitalize" numberOfLines={1}>{fmt.date(saving.expense_date)}</Text>
          </View>

          {/* max-w + numberOfLines: uzun miktar değeri kartı taşırmasın, sağda kırpılsın */}
          <View className="max-w-[45%] items-end gap-0.5">
            {quantity ? (
              <Text variant="body" className="font-semibold" numberOfLines={1}>{quantity}</Text>
            ) : null}
            {hasValue ? (
              <Text variant="muted" className="text-xs" numberOfLines={1}>≈ {fmt.money(saving.total_amount)}</Text>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
