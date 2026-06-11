import { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signOut } from '@/store/slices/authSlice';
import { colors } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [busy, setBusy] = useState(false);

  const name = user?.name?.trim() || 'Hesabım';
  const email = user?.email?.trim() || '';
  const initial = (user?.name?.trim()?.[0] ?? user?.email?.trim()?.[0] ?? '?').toUpperCase();

  const onLogout = () => {
    Alert.alert('Çıkış yap', 'Oturumu kapatmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış yap',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          await dispatch(signOut());
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
        >
          <Icon icon={ChevronLeft} size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="h1">Profil</Text>
      </View>

      <View className="flex-1 px-4 pt-2">
        <Card className="flex-row items-center gap-3">
          <View
            className="h-14 w-14 items-center justify-center rounded-full border border-border bg-surface"
          >
            <Text variant="h2">{initial}</Text>
          </View>
          <View className="flex-1">
            <Text variant="h2" numberOfLines={1}>{name}</Text>
            {email ? (
              <Text variant="muted" numberOfLines={1} className="mt-0.5">{email}</Text>
            ) : null}
          </View>
        </Card>

        <View className="mt-6">
          <Button
            label="Çıkış yap"
            variant="danger"
            leftIcon={LogOut}
            onPress={onLogout}
            loading={busy}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
