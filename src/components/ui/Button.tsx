import { Pressable, ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon, type IconComponent } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-accent active:opacity-80',
  secondary: 'bg-surface border border-border active:opacity-70',
  ghost: 'active:opacity-60',
  danger: 'bg-danger active:opacity-80',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-foreground',
  ghost: 'text-accent',
  danger: 'text-white',
};

const ICON_COLOR: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.foreground,
  ghost: colors.accent,
  danger: colors.white,
};

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconComponent;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  label, onPress, variant = 'primary', loading, disabled, leftIcon, fullWidth = true, className,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-xl px-4 py-3',
        CONTAINER[variant],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={ICON_COLOR[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {leftIcon ? <Icon icon={leftIcon} size={18} color={ICON_COLOR[variant]} /> : null}
          <Text className={cn('text-base font-semibold', LABEL[variant])}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
