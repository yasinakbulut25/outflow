import { useEffect, useRef } from 'react';
import { View, Pressable, ScrollView, type LayoutChangeEvent } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import { getMonthName } from '@/lib/formatters';
import { haptics } from '@/lib/haptics';
import { usePeriod } from '@/hooks/usePeriod';

// value: null = "Tümü", 1-12 = ay
const CHIPS: { key: string; label: string; value: number | null }[] = [
  { key: 'all', label: 'Tümü', value: null },
  ...Array.from({ length: 12 }, (_, i) => ({ key: String(i + 1), label: getMonthName(i + 1), value: i + 1 })),
];

/** Çipi yatay listede ortalayacak scroll x'i (saf — ref okumaz). */
function centerX(x: number, width: number, containerWidth: number): number {
  return Math.max(0, x + width / 2 - containerWidth / 2);
}

export function PeriodBar() {
  const { year, month, setMonth, prevYear, nextYear } = usePeriod();

  const scrollRef = useRef<ScrollView>(null);
  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const containerWidth = useRef(0);
  const didInitialScroll = useRef(false);

  const selectedKey = month === null ? 'all' : String(month);

  // Seçim değiştiğinde (ölçümler hazırsa) seçili çipi ortala.
  useEffect(() => {
    if (!didInitialScroll.current) return;
    const l = layouts.current[selectedKey];
    if (l && containerWidth.current) {
      scrollRef.current?.scrollTo({ x: centerX(l.x, l.width, containerWidth.current), animated: true });
    }
  }, [selectedKey]);

  return (
    <View className="gap-3 pb-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={prevYear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Önceki yıl"
          className="p-1 active:opacity-60"
        >
          <Icon icon={ChevronLeft} size={22} color={colors.foreground} />
        </Pressable>
        <Text variant="h2">{year}</Text>
        <Pressable
          onPress={nextYear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Sonraki yıl"
          className="p-1 active:opacity-60"
        >
          <Icon icon={ChevronRight} size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-0.5"
        onLayout={(e) => {
          containerWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {CHIPS.map((chip) => {
          const active = month === chip.value;
          return (
            <Pressable
              key={chip.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={chip.label}
              onPress={() => {
                haptics.selection();
                setMonth(chip.value === null ? null : month === chip.value ? null : chip.value);
              }}
              onLayout={(e: LayoutChangeEvent) => {
                const { x, width } = e.nativeEvent.layout;
                layouts.current[chip.key] = { x, width };
                // İlk render: seçili çip ölçülünce animasyonsuz ortala.
                if (!didInitialScroll.current && chip.key === selectedKey && containerWidth.current) {
                  didInitialScroll.current = true;
                  scrollRef.current?.scrollTo({ x: centerX(x, width, containerWidth.current), animated: false });
                }
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 active:opacity-70',
                active ? 'bg-accent' : 'bg-surface border border-border',
              )}
            >
              <Text className={cn('text-sm font-medium', active ? 'text-white' : 'text-muted')}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
