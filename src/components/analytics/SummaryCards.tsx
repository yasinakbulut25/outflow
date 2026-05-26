import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';

const TEAL = '#0d9488';
const RED = '#ef4444';

export function SummaryCards({
  summary,
}: {
  summary: { total_income: number; total_expense: number; net: number };
}) {
  const netColor = summary.net >= 0 ? TEAL : RED;

  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <Card className="flex-1">
          <Text variant="muted">Gelir</Text>
          <Text variant="mono" className="mt-1 text-lg" style={{ color: TEAL }}>
            {formatCurrency(summary.total_income)} ₺
          </Text>
        </Card>
        <Card className="flex-1">
          <Text variant="muted">Gider</Text>
          <Text variant="mono" className="mt-1 text-lg" style={{ color: RED }}>
            {formatCurrency(summary.total_expense)} ₺
          </Text>
        </Card>
      </View>
      <Card>
        <Text variant="muted">Net</Text>
        <Text variant="mono" className="mt-1 text-2xl font-bold" style={{ color: netColor }}>
          {summary.net >= 0 ? '' : '−'}{formatCurrency(Math.abs(summary.net))} ₺
        </Text>
      </Card>
    </View>
  );
}
