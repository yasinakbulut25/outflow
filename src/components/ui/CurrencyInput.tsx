import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { LIMITS } from '@/lib/limits';

// Tutar girişi: yazılan sayı doğrudan değerdir. "999" → 999, "1200" → 1.200 (=1200 TL).
// Opsiyonel virgülle kuruş: "1234,5" → 1234,5. Gösterimde binlik ayırıcı eklenir.
interface CurrencyInputProps {
  value: number;
  onChangeValue: (value: number) => void;
  invalid?: boolean;
  className?: string;
}

/** Girdiyi rakam + tek ondalık ayırıcıya (virgül) indirger, ondalığı 2 haneyle sınırlar.
 *  Binlik noktaları (gösterimden gelen) silinir — virgül = ondalık, nokta = ayırıcı. */
function sanitize(raw: string): string {
  const s = raw.replace(/[^\d,]/g, '');
  const i = s.indexOf(',');
  if (i !== -1) {
    // Tam kısmı azami haneyle sınırla → sınırsız büyüklükte/uzunlukta sayı engellenir.
    const intPart = s.slice(0, i).replace(/,/g, '').slice(0, LIMITS.amountIntDigits);
    const dec = s.slice(i + 1).replace(/,/g, '').slice(0, 2);
    return `${intPart},${dec}`;
  }
  return s.slice(0, LIMITS.amountIntDigits);
}

function toNumber(s: string): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Binlik ayırıcılı gösterim; kullanıcının yazdığı ondalık aynen korunur. */
function display(s: string): string {
  if (!s) return '';
  const [int, dec] = s.split(',');
  const grouped = int ? Number(int).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : '0';
  return s.includes(',') ? `${grouped},${dec ?? ''}` : grouped;
}

/** Dışarıdan gelen sayıyı ham metne çevirir (binliksiz, ondalık virgüllü). */
function textFromValue(value: number): string {
  if (!value) return '';
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
}

export function CurrencyInput({ value, onChangeValue, invalid, className }: CurrencyInputProps) {
  const [text, setText] = useState<string>(() => textFromValue(value));
  // Dışarıdan value değişirse (örn. düzenleme) render sırasında senkronla (effect yok).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (toNumber(text) !== value) setText(textFromValue(value));
  }

  function handleChange(raw: string) {
    const s = sanitize(raw);
    setText(s);
    onChangeValue(toNumber(s));
  }

  return (
    <Input
      bottomSheet
      value={display(text)}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      placeholder="0"
      invalid={invalid}
      // Taban görsel (yükseklik, kenarlık, dikey ortalama) Input'tan gelir; burada
      // yalnızca tutara özgü sağa-yaslı, kalın ve tabular-nums eklenir.
      className={cn('text-right font-semibold', className)}
      style={{ fontVariant: ['tabular-nums'] }}
    />
  );
}
