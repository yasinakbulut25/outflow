import { getLocales } from 'expo-localization';

export type Language = 'tr' | 'en';
export type Currency = 'TRY' | 'EUR' | 'USD';

export const LANGUAGES: Language[] = ['tr', 'en'];
export const CURRENCIES: Currency[] = ['TRY', 'EUR', 'USD'];

// Para birimi sembolleri. Uygulama değerleri dönüştürmez; yalnızca sembolü değiştirir.
export const CURRENCY_SYMBOL: Record<Currency, string> = {
  TRY: '₺',
  EUR: '€',
  USD: '$',
};

// Intl için BCP-47 yerel kodu.
export const NUMBER_LOCALE: Record<Language, string> = {
  tr: 'tr-TR',
  en: 'en-US',
};

/** Cihaz dili Türkçe ise 'tr', değilse 'en'. */
export function detectLanguage(): Language {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    return code === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

/** Varsayılan para birimi: Türkçe → ₺, diğer diller → €. */
export function defaultCurrencyFor(lang: Language): Currency {
  return lang === 'tr' ? 'TRY' : 'EUR';
}

// ---------------------------------------------------------------------------
// Modül seviyesinde dil/para aynası — Redux ayarlarıyla senkron tutulur
// (LocaleGate, _layout.tsx). React dışı kodun (gerekirse) erişebilmesi için.
// ---------------------------------------------------------------------------
let _language: Language = detectLanguage();
let _currency: Currency = defaultCurrencyFor(_language);

export function setLocale(language: Language, currency: Currency): void {
  _language = language;
  _currency = currency;
}

export function getActiveLanguage(): Language {
  return _language;
}

export function getActiveCurrency(): Currency {
  return _currency;
}
