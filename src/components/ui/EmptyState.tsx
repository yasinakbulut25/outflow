import Animated, { FadeIn } from 'react-native-reanimated';
import { Inbox } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon, type IconComponent } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: IconComponent;
}

export function EmptyState({ message, description, icon = Inbox }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)} className="items-center justify-center px-8 py-16 gap-2">
      <Icon icon={icon} size={40} color={colors.border} strokeWidth={1.5} />
      <Text variant="label" className="mt-1 text-center">{message}</Text>
      {description ? (
        <Text variant="muted" className="text-center">{description}</Text>
      ) : null}
    </Animated.View>
  );
}
