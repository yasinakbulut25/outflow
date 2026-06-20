import { Modal, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissOnboarding } from '@/store/slices/authSlice';

// Yeni kullanıcı kayıt olup uygulamaya ilk girdiğinde, kendisi için eklenen örnek
// verileri tanıtan tek seferlik modal. Yalnızca buton ile kapanır (bilinçli kapatma):
// arka plana dokunma ve Android geri tuşu modalı kapatmaz.
export function OnboardingModal() {
  const dispatch = useAppDispatch();
  const visible = useAppSelector((s) => s.auth.showOnboarding);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6">
          <View
            className="mb-4 h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.accent + '14' }}
          >
            <Icon icon={Sparkles} size={26} color={colors.accent} />
          </View>

          <Text variant="h2" className="mb-2">
            Hoş geldin! 👋
          </Text>
          <Text variant="muted" className="mb-6">
            Uygulamayı daha kolay tanıman için senin adına birkaç örnek kayıt ekledik:
            harcamalar, gelirler, birikimler ve düzenli ödemeler. Hepsini inceleyebilir,
            düzenleyebilir veya silebilirsin.
          </Text>

          <Button
            label="Harika, inceleyeyim"
            fullWidth
            onPress={() => dispatch(dismissOnboarding())}
          />
        </View>
      </View>
    </Modal>
  );
}
