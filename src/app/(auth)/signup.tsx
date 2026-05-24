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
import { useRegisterMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { signIn } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';

const schema = z
  .object({
    display_name: z.string().trim().min(1, 'Ad gerekli'),
    username: z.string().trim().min(3, 'En az 3 karakter'),
    password: z.string().min(6, 'En az 6 karakter'),
    confirm: z.string().min(1, 'Şifreyi tekrar gir'),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Şifreler eşleşmiyor',
  });
type FormValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: '', username: '', password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const auth = await register({
        username: values.username,
        password: values.password,
        display_name: values.display_name,
      }).unwrap();
      await dispatch(signIn(auth)).unwrap();
      router.replace('/(tabs)');
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, 'Kayıt başarısız'), 'error'));
    }
  });

  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="h1">Hesap oluştur</Text>
        <Text variant="muted">Birkaç saniye sürer</Text>
      </View>

      <View className="gap-4">
        <Controller
          control={control}
          name="display_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field label="Adın" error={errors.display_name?.message}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                invalid={!!errors.display_name}
                autoComplete="name"
                placeholder="Adın"
                returnKeyType="next"
              />
            </Field>
          )}
        />
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
                autoComplete="username-new"
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
                autoComplete="password-new"
                placeholder="••••••••"
                returnKeyType="next"
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field label="Şifre (tekrar)" error={errors.confirm?.message}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                invalid={!!errors.confirm}
                secureTextEntry
                autoComplete="password-new"
                placeholder="••••••••"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            </Field>
          )}
        />
      </View>

      <Button label="Kayıt ol" onPress={onSubmit} loading={isLoading} />

      <View className="flex-row justify-center gap-1">
        <Text variant="muted">Zaten hesabın var mı?</Text>
        <Link href="/(auth)/login" className="text-sm font-medium text-accent">
          Giriş yap
        </Link>
      </View>
    </Screen>
  );
}
