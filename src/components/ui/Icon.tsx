import type { ComponentType } from 'react';
import { colors } from '@/theme/tokens';

// Lucide ikonlarının ortak prop arayüzü (lucide sürümünden bağımsız tutmak için yerel tip).
export type IconComponent = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface IconProps {
  icon: IconComponent;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ icon: LucideIcon, size = 22, color = colors.foreground, strokeWidth = 2 }: IconProps) {
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
}
