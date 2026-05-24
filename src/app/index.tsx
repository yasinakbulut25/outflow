import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

// Açılış: oturum durumuna göre yönlendir.
export default function Index() {
  const user = useAppSelector((s) => s.auth.user);
  return <Redirect href={user ? '/(tabs)' : '/(auth)/login'} />;
}
