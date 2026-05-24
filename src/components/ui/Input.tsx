import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  className?: string;
  invalid?: boolean;
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      className={cn(
        'rounded-xl border bg-white px-3 py-3 text-base text-foreground',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      {...rest}
    />
  );
}
