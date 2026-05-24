// RTK Query hatasından kullanıcıya gösterilecek mesajı çıkarır.
// baseQuery (store/api.ts) success:false durumunda mesajı error.data'ya string koyar.
export function getErrorMessage(error: unknown, fallback = 'Bir hata oluştu'): string {
  if (!error || typeof error !== 'object') return fallback;
  const e = error as { status?: number | string; data?: unknown; error?: string };
  if (typeof e.data === 'string' && e.data.trim()) return e.data;
  if (e.status === 'FETCH_ERROR') return 'Sunucuya ulaşılamadı. Bağlantını kontrol et.';
  return fallback;
}
