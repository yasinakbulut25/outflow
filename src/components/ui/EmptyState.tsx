import { View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon, type IconComponent } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

interface EmptyStateProps {
  message: string;
  icon?: IconComponent;
}

export function EmptyState({ message, icon = Inbox }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-16 gap-3">
      <Icon icon={icon} size={40} color={colors.border} strokeWidth={1.5} />
      <Text variant="muted" className="text-center">{message}</Text>
    </View>
  );
}
