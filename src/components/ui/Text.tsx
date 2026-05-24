import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/cn';

type Variant = 'h1' | 'h2' | 'body' | 'muted' | 'label' | 'mono';

const VARIANTS: Record<Variant, string> = {
  h1: 'text-2xl font-bold text-foreground',
  h2: 'text-lg font-semibold text-foreground',
  body: 'text-base text-foreground',
  muted: 'text-sm text-muted',
  label: 'text-sm font-medium text-foreground',
  mono: 'text-base font-semibold text-foreground',
};

interface TextProps extends RNTextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = 'body', className, style, ...rest }: TextProps) {
  const isMono = variant === 'mono';
  return (
    <RNText
      className={cn(VARIANTS[variant], className)}
      style={[isMono ? { fontVariant: ['tabular-nums'] } : null, style]}
      {...rest}
    />
  );
}
