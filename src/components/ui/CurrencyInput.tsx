import { useState, useEffect } from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import { formatCurrency, parseCurrencyInput } from '@/lib/formatters';

// ATM tarzı tutar girişi: yalnız rakam, sağdan sola dolar (son 2 hane kuruş).
// "425000" → 4.250,00. value (number) dışarıdan kontrol edilir.
interface CurrencyInputProps {
  value: number;
  onChangeValue: (value: number) => void;
  invalid?: boolean;
  className?: string;
}

function digitsFromValue(value: number): string {
  if (!value) return '';
  return String(Math.round(value * 100));
}

export function CurrencyInput({ value, onChangeValue, invalid, className }: CurrencyInputProps) {
  const [digits, setDigits] = useState<string>(digitsFromValue(value));

  // Dışarıdan value değişirse (örn. düzenleme) senkronla
  useEffect(() => {
    const incoming = digitsFromValue(value);
    setDigits((prev) => (parseCurrencyInput(prev) === value ? prev : incoming));
  }, [value]);

  function handleChange(text: string) {
    const next = text.replace(/\D/g, '').replace(/^0+/, '');
    setDigits(next);
    onChangeValue(parseCurrencyInput(next));
  }

  return (
    <TextInput
      value={digits ? formatCurrency(parseCurrencyInput(digits)) : ''}
      onChangeText={handleChange}
      keyboardType="number-pad"
      placeholder="0"
      placeholderTextColor={colors.muted}
      textAlignVertical="center"
      className={cn(
        'rounded-xl border bg-white px-3 py-3 text-right text-base font-semibold text-foreground',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      style={{ fontVariant: ['tabular-nums'], includeFontPadding: false }}
    />
  );
}
