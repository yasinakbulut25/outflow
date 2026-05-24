// Uygulama konfigürasyonu. API adresi ortam değişkeninden okunur.
// .env dosyasında EXPO_PUBLIC_API_URL tanımlanır (örn. http://192.168.1.20:3000).
// Tanımsızsa geliştirme için localhost'a düşer (yalnız web/emülatörde anlamlı).
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
