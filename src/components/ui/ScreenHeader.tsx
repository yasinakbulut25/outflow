import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

interface ScreenHeaderProps {
  title: string;
  description?: string;
  right?: ReactNode; // sağda opsiyonel aksiyon/kontrol (örn. yıl seçici)
  className?: string;
}

// Ekran başlığı + açıklama. Birden çok ekranda yeniden kullanılır.
export function ScreenHeader({ title, description, right, className }: ScreenHeaderProps) {
  return (
    <View className={cn('mb-3 flex-row items-start justify-between gap-3', className)}>
      <View className="flex-1">
        <Text variant="h1">{title}</Text>
        {description ? (
          <Text variant="muted" className="mt-1">{description}</Text>
        ) : null}
      </View>
      {right ? <View className="shrink-0">{right}</View> : null}
    </View>
  );
}
