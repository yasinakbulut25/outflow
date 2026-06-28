import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  CURRENCY_SYMBOL,
  type Currency,
  type Language,
} from '@/i18n/locale';
import { categoryName, translate, type TParams } from '@/i18n/translate';
import {
  formatDate,
  formatDayHeader,
  formatMonthYear,
  formatNumber,
  formatSigned,
  getMonthName,
} from '@/lib/formatters';

export { categoryName, translate, type TParams };

// React hook'ları ----------------------------------------------------------

export function useSettings(): { language: Language; currency: Currency } {
  const language = useAppSelector((s) => s.settings.language);
  const currency = useAppSelector((s) => s.settings.currency);
  return { language, currency };
}

export function useTranslation() {
  const { language, currency } = useSettings();
  const t = useCallback(
    (key: string, params?: TParams) => translate(language, key, params),
    [language],
  );
  return { t, language, currency };
}

/** Aktif kategori isimlendiricisi (dile bağlı). */
export function useCategoryName(): (id?: number) => string {
  const { language } = useSettings();
  return useCallback((id?: number) => categoryName(id, language), [language]);
}

/** Aktif dil + para birimine bağlı biçimlendiriciler. Sembolü içeren `money`/
 *  `moneySigned` ile sembolsüz `num`/`numSigned` ayrı verilir. */
export function useFormat() {
  const { language, currency } = useSettings();
  return useMemo(() => {
    const symbol = CURRENCY_SYMBOL[currency];
    const num = (v: number) => formatNumber(v, language);
    const numSigned = (v: number) => formatSigned(v, language);
    return {
      symbol,
      num,
      numSigned,
      money: (v: number) => `${num(v)} ${symbol}`,
      moneySigned: (v: number) => `${numSigned(v)} ${symbol}`,
      date: (dateStr: string, format?: 'long' | 'short') => formatDate(dateStr, language, format),
      dayHeader: (dateStr: string) => formatDayHeader(dateStr, language),
      monthName: (monthIndex: number) => getMonthName(monthIndex, language),
      monthYear: (monthStr: string) => formatMonthYear(monthStr, language),
    };
  }, [language, currency]);
}
