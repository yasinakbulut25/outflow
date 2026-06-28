import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CloudOff } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/tokens';
import { useTranslation } from '@/i18n';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <Animated.View entering={FadeIn.duration(200)} className="items-center justify-center gap-3 py-16">
      <Icon icon={CloudOff} size={40} color={colors.border} strokeWidth={1.5} />
      <Text variant="muted" className="text-center">{message ?? t("common.dataError")}</Text>
      {onRetry ? (
        <View className="w-40">
          <Button label={t('common.retry')} variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </Animated.View>
  );
}
