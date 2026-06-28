import type { ExpoConfig } from 'expo/config';

// expo-auth-session Google sağlayıcısı, iOS'ta OAuth dönüşü için ters çevrilmiş client ID
// URL şemasını gerektirir (com.googleusercontent.apps.<id>). Şemayı env'deki iOS client
// ID'sinden türetiyoruz ki .env değişince Info.plist ile (prebuild'de) senkron kalsın.
const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const googleReversedScheme = iosGoogleClientId
  ? `com.googleusercontent.apps.${iosGoogleClientId.replace(/\.apps\.googleusercontent\.com$/, '')}`
  : undefined;

const config: ExpoConfig = {
  name: 'Outflow',
  slug: 'outflow',
  version: '1.0.3',
  owner: 'yasinakbulut',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'outflow',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/images/icon.png',
    bundleIdentifier: 'com.yasinakbulut.outflow',
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      // Yalnızca standart HTTPS kullanılıyor → ihracat uyumluluğu sorusunu otomatik "Hayır" yapar.
      ITSAppUsesNonExemptEncryption: false,
      // Uygulama Türkçe + İngilizce → App Store'un desteklenen dilleri göstermesi için yerelleştirmeyi beyan et.
      CFBundleDevelopmentRegion: 'tr',
      CFBundleLocalizations: ['tr', 'en'],
      ...(googleReversedScheme
        ? { CFBundleURLTypes: [{ CFBundleURLSchemes: [googleReversedScheme] }] }
        : {}),
    },
  },
  android: {
    package: 'com.yasinakbulut.outflow',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-image',
    'expo-apple-authentication',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-secure-store',
    'expo-localization',
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: '57d6b2fd-a7a8-4fa9-a63b-a7fafa35cf63',
    },
  },
};

export default config;
