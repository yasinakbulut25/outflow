import { View, Pressable } from 'react-native';
import { TrendingUp, Repeat } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { useTranslation, useFormat } from '@/i18n';
import type { Income } from '@/types';

const TEAL = '#16a34a';

export function IncomeCard({ income, onPress }: { income: Income; onPress?: (i: Income) => void }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const isRecurring = !!income.recurring_income_id;
  const TypeIcon = isRecurring ? Repeat : TrendingUp;

  return (
    <Pressable onPress={() => onPress?.(income)} className="active:opacity-70">
      <Card className="mb-2">
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: TEAL + '1a' }}>
            <Icon icon={TypeIcon} size={18} color={TEAL} />
          </View>

          <View className="flex-1">
            <Text variant="body" className="font-medium" numberOfLines={1}>{income.title}</Text>
            <Text variant="muted" className="capitalize">{fmt.date(income.income_date)}</Text>
          </View>

          <View className="items-end gap-1">
            <Text variant="mono" style={{ color: TEAL }}>{fmt.money(income.amount)}</Text>
            <Badge label={isRecurring ? t('income.recurring') : t('income.oneTime')} tone="neutral" />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
