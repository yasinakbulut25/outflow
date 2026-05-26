import { useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { ChevronDown, Repeat, HandCoins } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import { getMonthName, formatCurrency } from '@/lib/formatters';
import { DayGroup } from './DayGroup';
import { ExpenseCard } from './ExpenseCard';
import { SavingsCard } from '@/components/savings/SavingsCard';
import type { MonthGroup as MonthGroupModel } from '@/lib/groupExpenses';
import type { Expense } from '@/types';

const EMERALD = '#059669';

interface Props {
  group: MonthGroupModel;
  defaultExpanded?: boolean;
  onPressExpense?: (e: Expense) => void;
  onPressSaving?: (e: Expense) => void;
}

// Ay içindeki düzenli ödemeleri tek satıra toplayan katlanabilir bölüm.
function RecurringSection({ group, onPressExpense }: { group: MonthGroupModel; onPressExpense?: (e: Expense) => void }) {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const toggle = () => {
    rotation.value = withTiming(open ? 0 : 180, { duration: 200 });
    setOpen((v) => !v);
  };

  return (
    <View className="mt-1 rounded-xl border border-border bg-surface">
      <Pressable onPress={toggle} className="flex-row items-center gap-3 px-3 py-3 active:opacity-70">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
          <Icon icon={Repeat} size={16} color={colors.muted} />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-medium">Düzenli Ödemeler</Text>
          <Text variant="muted">{group.recurring.length} ödeme</Text>
        </View>
        <Text variant="mono">{formatCurrency(group.recurringAmount)} ₺</Text>
        <Animated.View style={chevronStyle}>
          <Icon icon={ChevronDown} size={18} color={colors.muted} />
        </Animated.View>
      </Pressable>

      {open ? (
        <Animated.View entering={FadeIn.duration(150)} className="px-3 pb-2 pt-1">
          {group.recurring.map((e) => (
            <ExpenseCard key={e.id} expense={e} onPress={onPressExpense} />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

// Ay içindeki birikimleri (kategori 13) ayrı emerald bölümde toplar.
function SavingsSection({ group, onPressSaving }: { group: MonthGroupModel; onPressSaving?: (e: Expense) => void }) {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const toggle = () => {
    rotation.value = withTiming(open ? 0 : 180, { duration: 200 });
    setOpen((v) => !v);
  };

  return (
    <View className="mt-1 rounded-xl border" style={{ borderColor: EMERALD + '33', backgroundColor: EMERALD + '0d' }}>
      <Pressable onPress={toggle} className="flex-row items-center gap-3 px-3 py-3 active:opacity-70">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
          <Icon icon={HandCoins} size={16} color={EMERALD} />
        </View>
        <View className="flex-1">
          <Text variant="body" className="font-medium">Birikimler</Text>
          <Text variant="muted">{group.savings.length} birikim</Text>
        </View>
        {group.savingsAmount > 0 ? (
          <Text variant="mono" style={{ color: EMERALD }}>≈ {formatCurrency(group.savingsAmount)} ₺</Text>
        ) : null}
        <Animated.View style={chevronStyle}>
          <Icon icon={ChevronDown} size={18} color={EMERALD} />
        </Animated.View>
      </Pressable>

      {open ? (
        <Animated.View entering={FadeIn.duration(150)} className="px-3 pb-2 pt-1">
          {group.savings.map((e) => (
            <SavingsCard key={e.id} saving={e} onPress={onPressSaving} />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

export function MonthGroup({ group, defaultExpanded = false, onPressExpense, onPressSaving }: Props) {
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
          <View className="mt-0.5 flex-row flex-wrap gap-x-3">
            {group.cashAmount > 0 ? (
              <Text variant="muted">Peşin {formatCurrency(group.cashAmount)} ₺</Text>
            ) : null}
            {group.installmentAmount > 0 ? (
              <Text variant="muted">Taksit {formatCurrency(group.installmentAmount)} ₺</Text>
            ) : null}
            {group.recurringAmount > 0 ? (
              <Text variant="muted">Düzenli {formatCurrency(group.recurringAmount)} ₺</Text>
            ) : null}
            {group.savingsAmount > 0 ? (
              <Text variant="muted" style={{ color: EMERALD }}>Birikim ≈ {formatCurrency(group.savingsAmount)} ₺</Text>
            ) : null}
          </View>
        </View>
        <Text variant="mono" className="text-lg">{formatCurrency(group.totalAmount)} ₺</Text>
        <Animated.View style={chevronStyle}>
          <Icon icon={ChevronDown} size={20} color={colors.muted} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View entering={FadeIn.duration(150)} className={cn('px-4 pb-3 pt-1')}>
          {group.days.map((day) => (
            <DayGroup key={day.date} day={day} onPressExpense={onPressExpense} />
          ))}
          {group.recurring.length > 0 ? (
            <RecurringSection group={group} onPressExpense={onPressExpense} />
          ) : null}
          {group.savings.length > 0 ? (
            <SavingsSection group={group} onPressSaving={onPressSaving} />
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}
