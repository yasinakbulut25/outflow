import type { Language } from '@/i18n/locale';
import { resources } from '@/i18n/translations';

export type TParams = Record<string, string | number>;

/** Düz nokta-yollu anahtar çözümleyici. Bulunamazsa tr'ye, o da yoksa anahtarın
 *  kendisine düşer. {param} yer tutucuları verilen değerlerle değiştirilir.
 *  React'e bağımlı değildir (hook dışı kod da kullanabilir). */
export function translate(lang: Language, key: string, params?: TParams): string {
  const resolve = (l: Language): unknown =>
    key
      .split('.')
      .reduce<unknown>(
        (o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]),
        resources[l],
      );

  let value = resolve(lang);
  if (typeof value !== 'string') value = resolve('tr');
  if (typeof value !== 'string') return key;

  let str = value;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

/** Kategori id → aktif dile göre isim (1-13). */
export function categoryName(id: number | undefined, lang: Language): string {
  if (id == null) return translate(lang, 'categories.other');
  return translate(lang, `categories.${id}`);
}
