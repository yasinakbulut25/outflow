import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

interface FieldProps {
  label?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, children, className }: FieldProps) {
  return (
    <View className={cn('gap-1.5', className)}>
      {label ? <Text variant="label">{label}</Text> : null}
      {children}
      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
