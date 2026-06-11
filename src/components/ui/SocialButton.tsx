import type { ReactNode } from 'react';
import { Pressable, ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

interface SocialButtonProps {
  label: string;
  logo: ReactNode; // başta gösterilen sağlayıcı logosu (Google/Apple)
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Sosyal giriş butonu — Google ve Apple aynı görünümü paylaşır: beyaz zemin, ince
 *  kenarlık, başta marka logosu, ortalanmış etiket. Sabit yükseklik input/Button ile uyumlu. */
export function SocialButton({ label, logo, onPress, loading, disabled, className }: SocialButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      className={cn(
        'h-12 flex-row items-center justify-center gap-3 rounded-xl border border-border bg-white active:opacity-70',
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={colors.foreground} />
      ) : (
        <>
          <View className="h-5 w-5 items-center justify-center">{logo}</View>
          <Text className="text-base font-medium text-foreground">{label}</Text>
        </>
      )}
    </Pressable>
  );
}
