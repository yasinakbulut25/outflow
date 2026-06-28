// RTK Query hatasından kullanıcıya gösterilecek mesajı çıkarır.
// baseQuery (store/api.ts) success:false durumunda mesajı error.data'ya string koyar.
// Mesajlar aktif dile göre yerelleştirilir (modül seviyesindeki dil aynası).
import { getActiveLanguage } from '@/i18n/locale';
import { translate } from '@/i18n/translate';

export function getErrorMessage(error: unknown, fallback?: string): string {
  const lang = getActiveLanguage();
  const fb = fallback ?? translate(lang, 'common.genericError');
  if (!error || typeof error !== 'object') return fb;
  const e = error as { status?: number | string; data?: unknown; error?: string };
  if (typeof e.data === 'string' && e.data.trim()) return e.data;
  if (e.status === 'FETCH_ERROR') return translate(lang, 'common.serverUnreachable');
  return fb;
}
