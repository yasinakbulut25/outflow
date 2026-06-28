import { View, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';
import { usePeriod } from '@/hooks/usePeriod';
import { useTranslation } from '@/i18n';

// Kompakt yıl seçici pill (ScreenHeader sağ slotunda kullanılır). usePeriod ile çalışır.
export function YearStepper() {
  const { t } = useTranslation();
  const { year, prevYear, nextYear } = usePeriod();
  return (
    <View className="flex-row items-center gap-1 rounded-full border border-border bg-white p-1">
      <Pressable onPress={prevYear} hitSlop={6} accessibilityRole="button" accessibilityLabel={t("a11y.prevYear")} className="p-1 active:opacity-60">
        <Icon icon={ChevronLeft} size={18} color={colors.foreground} />
      </Pressable>
      <Text variant="h2" className="px-1 text-base">{year}</Text>
      <Pressable onPress={nextYear} hitSlop={6} accessibilityRole="button" accessibilityLabel={t("a11y.nextYear")} className="p-1 active:opacity-60">
        <Icon icon={ChevronRight} size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
