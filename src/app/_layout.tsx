import '@/global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapAuth } from '@/store/slices/authSlice';
import { ToastHost } from '@/components/ui/ToastHost';
import { colors } from '@/theme/tokens';

function RootNavigator() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((s) => s.auth.hydrated);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
