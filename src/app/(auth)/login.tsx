import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLoginMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { signIn } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';

const schema = z.object({
  username: z.string().trim().min(1, 'Kullanıcı adı gerekli'),
  password: z.string().min(1, 'Şifre gerekli'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const auth = await login(values).unwrap();
      await dispatch(signIn(auth)).unwrap();
      router.replace('/(tabs)');
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, 'Giriş başarısız'), 'error'));
    }
  });

  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="h1">Outflow</Text>
        <Text variant="muted">Hesabına giriş yap</Text>
      </View>

      <View className="gap-4">
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field label="Kullanıcı adı" error={errors.username?.message}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                invalid={!!errors.username}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                placeholder="kullanici_adi"
                returnKeyType="next"
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field label="Şifre" error={errors.password?.message}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                invalid={!!errors.password}
                secureTextEntry
                autoComplete="current-password"
                placeholder="••••••••"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            </Field>
          )}
        />
      </View>

      <Button label="Giriş yap" onPress={onSubmit} loading={isLoading} />

      <View className="flex-row justify-center gap-1">
        <Text variant="muted">Hesabın yok mu?</Text>
        <Link href="/(auth)/signup" className="text-sm font-medium text-accent">
          Kayıt ol
        </Link>
      </View>
    </Screen>
  );
}
