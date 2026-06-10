import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import { SheetTextInput } from '@/components/ui/SheetTextInput';

interface InputProps extends TextInputProps {
  className?: string;
  invalid?: boolean;
  /** Bir bottom-sheet içinde kullanılıyorsa true ver: klavye açılınca odaklanan input
   *  klavyenin üstünde kalır (BottomSheetTextInput). Düz ekranlarda (login vb.) verme. */
  bottomSheet?: boolean;
}

export function Input({ className, invalid, style, bottomSheet, ...rest }: InputProps) {
  const Comp = (bottomSheet ? SheetTextInput : TextInput) as typeof TextInput;
  return (
    <Comp
      placeholderTextColor={colors.muted}
      textAlignVertical="center"
      className={cn(
        'rounded-xl border bg-white px-3 py-3 text-base text-foreground',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      // includeFontPadding: Android'de metnin üstte boşluk bırakmasını önler (dikey ortalama).
      style={[{ includeFontPadding: false }, style]}
      {...rest}
    />
  );
}
