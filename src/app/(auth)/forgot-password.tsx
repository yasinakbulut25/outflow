import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useForgotPasswordMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import { LIMITS } from '@/lib/limits';
import { enableMockSession, isMockEmail } from '@/lib/mockBackend';
import { colors } from '@/theme/tokens';

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-posta gerekli')
    .max(LIMITS.email, 'E-posta çok uzun')
    .email('Geçerli bir e-posta gir'),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    // Demo e-posta → bu oturumu mock backend'e yönlendir (gerçek backend olmadan test için).
    if (isMockEmail(email)) enableMockSession();
    try {
      await forgotPassword({ email }).unwrap();
      router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, 'Kod gönderilemedi'), 'error'));
    }
  });

  return (
    <Screen scroll className="gap-8">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Geri"
        hitSlop={8}
        className="h-9 w-9 -ml-1 items-center justify-center rounded-full active:opacity-60"
      >
        <Icon icon={ChevronLeft} size={24} color={colors.foreground} />
      </Pressable>

      <View className="gap-1">
        <Text variant="h1">Şifreni mi unuttun?</Text>
        <Text variant="muted">
          Hesabının e-postasını gir; doğrulama kodu gönderelim.
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Field label="E-posta" error={errors.email?.message}>
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              invalid={!!errors.email}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              maxLength={LIMITS.email}
              placeholder="ornek@email.com"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
          </Field>
        )}
      />

      <Button label="Kod gönder" onPress={onSubmit} loading={isLoading} />
    </Screen>
  );
}
