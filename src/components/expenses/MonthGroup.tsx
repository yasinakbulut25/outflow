import { useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import { getMonthName, formatCurrency } from '@/lib/formatters';
import { DayGroup } from './DayGroup';
import type { MonthGroup as MonthGroupModel } from '@/lib/groupExpenses';
import type { Expense } from '@/types';

interface Props {
  group: MonthGroupModel;
  defaultExpanded?: boolean;
  onPressExpense?: (e: Expense) => void;
}

export function MonthGroup({ group, defaultExpanded = false, onPressExpense }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 180 : 0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    rotation.value = withTiming(expanded ? 0 : 180, { duration: 200 });
    setExpanded((v) => !v);
  };

  return (
    <View className="mb-3 overflow-hidden rounded-xl border border-border bg-white">
      <Pressable onPress={toggle} className="flex-row items-center gap-3 p-4 active:opacity-70">
        <View className="flex-1">
          <Text variant="h2">{getMonthName(group.month)}</Text>
          <View className="mt-0.5 flex-row gap-3">
            {group.cashAmount > 0 ? (
              <Text variant="muted">Peşin {formatCurrency(group.cashAmount)} ₺</Text>
            ) : null}
            {group.installmentAmount > 0 ? (
              <Text variant="muted">Taksit {formatCurrency(group.installmentAmount)} ₺</Text>
            ) : null}
          </View>
        </View>
        <Text variant="mono" className="text-lg">{formatCurrency(group.totalAmount)} ₺</Text>
        <Animated.View style={chevronStyle}>
          <Icon icon={ChevronDown} size={20} color={colors.muted} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View entering={FadeIn.duration(150)} className={cn('px-4 pb-2 pt-1')}>
          {group.days.map((day) => (
            <DayGroup key={day.date} day={day} onPressExpense={onPressExpense} />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}
