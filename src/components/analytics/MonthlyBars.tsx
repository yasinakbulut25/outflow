import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTranslation, useFormat } from '@/i18n';
import type { Language } from '@/i18n/locale';
import type { MonthlyNet } from '@/types';

const TEAL = '#16a34a';
const RED = '#ef4444';

function monthNo(m: string): number {
  return Number(m.slice(5, 7));
}

// Kısa para etiketi (taşmayı önler): TR 1.250.000 → 1,3M, 12.500 → 12,5B (bin).
// EN 1,250,000 → 1.3M, 12,500 → 12.5K (thousand).
function compact(v: number, lang: Language): string {
  const sep = lang === 'tr' ? ',' : '.';
  const thousand = lang === 'tr' ? 'B' : 'K';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', sep)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace('.', sep)}${thousand}`;
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
  const { t, language } = useTranslation();
  const fmt = useFormat();
  const rows = data.filter((d) => d.income > 0 || d.expense > 0);
  if (!rows.length) return <Text variant="muted" className="py-2">{t("common.noData")}</Text>;

  const max = Math.max(...rows.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TEAL }} />
          <Text variant="muted" className="text-xs">{t("analytics.income")}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RED }} />
          <Text variant="muted" className="text-xs">{t("analytics.expense")}</Text>
        </View>
      </View>

      {rows.map((d) => (
        <View key={d.month} className="flex-row items-center gap-2">
          <Text variant="muted" className="w-8 text-xs">{fmt.monthName(monthNo(d.month)).slice(0, 3)}</Text>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <Bar value={d.income} max={max} color={TEAL} />
              <Text className="w-12 text-right text-xs" style={{ color: TEAL }} numberOfLines={1}>
                {compact(d.income, language)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Bar value={d.expense} max={max} color={RED} />
              <Text className="w-12 text-right text-xs" style={{ color: RED }} numberOfLines={1}>
                {compact(d.expense, language)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
