import { View, Pressable, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import { getMonthName } from '@/lib/formatters';
import { usePeriod } from '@/hooks/usePeriod';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full px-3.5 py-1.5 active:opacity-70',
        active ? 'bg-accent' : 'bg-surface border border-border',
      )}
    >
      <Text className={cn('text-sm font-medium', active ? 'text-white' : 'text-muted')}>{label}</Text>
    </Pressable>
  );
}

export function PeriodBar() {
  const { year, month, setMonth, prevYear, nextYear } = usePeriod();

  return (
    <View className="gap-3 pb-3">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={prevYear} hitSlop={8} className="p-1 active:opacity-60">
          <Icon icon={ChevronLeft} size={22} color={colors.foreground} />
        </Pressable>
        <Text variant="h2">{year}</Text>
        <Pressable onPress={nextYear} hitSlop={8} className="p-1 active:opacity-60">
          <Icon icon={ChevronRight} size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-0.5"
      >
        <Chip label="Tümü" active={month === null} onPress={() => setMonth(null)} />
        {MONTHS.map((m) => (
          <Chip
            key={m}
            label={getMonthName(m)}
            active={month === m}
            onPress={() => setMonth(month === m ? null : m)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
