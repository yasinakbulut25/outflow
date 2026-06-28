import { View, Pressable, Image } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { useAppSelector } from '@/store/hooks';
import { colors } from '@/theme/tokens';
import { useTranslation } from '@/i18n';

const LOGO = require('../../../assets/images/icon.png');

/** Tüm sekmelerin üstünde sabit duran marka çubuğu: logo + uygulama adı + profil butonu.
 *  (tabs)/_layout'ta Tabs header'ı olarak verilir; üst güvenli alan boşluğunu kendi yönetir. */
export function TopBar() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const initial = (user?.name?.trim()?.[0] ?? user?.email?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <View
      style={{ paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colors.border }}
      className="border-b"
    >
      <View className="h-14 flex-row items-center justify-between px-4">
        <View className="flex-row items-center gap-2">
          <Image source={LOGO} style={{ width: 28, height: 28, borderRadius: 7 }} />
          <Text variant="h2">Outflow</Text>
        </View>

        <Pressable
          // '/profile' route'u; typedRoutes tipleri dev server'da yenilenene dek Href ile veriyoruz.
          onPress={() => router.push('/profile' as Href)}
          accessibilityRole="button"
          accessibilityLabel={t("a11y.profile")}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
        >
          <Text variant="label">{initial}</Text>
        </Pressable>
      </View>
    </View>
  );
}
