import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <View className={cn('bg-white border border-border rounded-xl p-4', className)}>{children}</View>;
}
