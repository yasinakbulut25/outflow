// Uygulama konfigürasyonu. API adresi ortam değişkeninden okunur.
// .env dosyasında EXPO_PUBLIC_API_URL tanımlanır (örn. http://192.168.1.20:3000).
// Tanımsızsa geliştirme için localhost'a düşer (yalnız web/emülatörde anlamlı).
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

// Google OAuth client ID'leri. Google Cloud Console'dan alınır.
// iOS: com.outflow.app bundle ID ile iOS tip OAuth istemcisi
// Android: com.outflow.app paket adı + SHA-1 ile Android tip OAuth istemcisi
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
