import { Redirect, Stack } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export default function AuthLayout() {
  const user = useAppSelector((s) => s.auth.user);
  // Giriş yapmış kullanıcıyı uygulamaya yönlendir.
  if (user) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
