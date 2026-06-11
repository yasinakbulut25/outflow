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
        'h-12 rounded-xl border bg-white px-3 text-foreground',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      // Dikey ortalama: sabit yükseklik (h-12) + paddingVertical:0 + textAlignVertical:center.
      // fontSize style'dan verilir; `text-base` className'i lineHeight:24 de eklerdi ve bu fazla
      // satır yüksekliği metni (özellikle iOS'ta) aşağı kaydırıp yazınca zıplatırdı.
      // includeFontPadding:false Android'de fontun üstte bıraktığı boşluğu kaldırır.
      style={[{ fontSize: 16, paddingVertical: 0, includeFontPadding: false }, style]}
      {...rest}
    />
  );
}
