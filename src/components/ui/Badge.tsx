import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

export type BadgeTone = 'cash' | 'installment' | 'savings' | 'neutral';

const TONES: Record<BadgeTone, string> = {
  cash: 'bg-success/10',
  installment: 'bg-warning/10',
  savings: 'bg-emerald/10',
  neutral: 'bg-surface',
};

const TEXT_TONES: Record<BadgeTone, string> = {
  cash: 'text-success',
  installment: 'text-warning',
  savings: 'text-emerald',
  neutral: 'text-muted',
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ label, tone = 'neutral', className }: BadgeProps) {
  return (
    <View className={cn('self-start rounded-full px-2 py-0.5', TONES[tone], className)}>
      <Text className={cn('text-xs font-medium', TEXT_TONES[tone])}>{label}</Text>
    </View>
  );
}
