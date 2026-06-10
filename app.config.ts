import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Outflow',
  slug: 'outflow',
  version: '1.0.0',
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
  },
  android: {
    package: 'com.outflow.app',
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
