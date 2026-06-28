import { useEffect, useMemo, useRef } from 'react';
import { View, Pressable, ScrollView, type LayoutChangeEvent } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { usePeriod } from '@/hooks/usePeriod';
import { useTranslation, useFormat } from '@/i18n';

/** Çipi yatay listede ortalayacak scroll x'i (saf — ref okumaz). */
function centerX(x: number, width: number, containerWidth: number): number {
  return Math.max(0, x + width / 2 - containerWidth / 2);
}

export function PeriodBar() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const { month, setMonth } = usePeriod();

  // value: null = t('period.all'), 1-12 = ay
  const chips = useMemo(
    () => [
      { key: 'all', label: t('period.all'), value: null as number | null },
      ...Array.from({ length: 12 }, (_, i) => ({ key: String(i + 1), label: fmt.monthName(i + 1), value: i + 1 as number | null })),
    ],
    [t, fmt],
  );

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
    <View className="pb-3">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-0.5"
        onLayout={(e) => {
          containerWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {chips.map((chip) => {
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
