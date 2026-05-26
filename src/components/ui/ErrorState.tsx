import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CloudOff } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/tokens';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Veriler yüklenemedi.', onRetry }: ErrorStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)} className="items-center justify-center gap-3 py-16">
      <Icon icon={CloudOff} size={40} color={colors.border} strokeWidth={1.5} />
      <Text variant="muted" className="text-center">{message}</Text>
      {onRetry ? (
        <View className="w-40">
          <Button label="Tekrar dene" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </Animated.View>
  );
}
