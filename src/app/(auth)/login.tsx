import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import AppleSignInButton from '@/components/AppleSignInButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLoginMutation, useGoogleAuthMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { signIn } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '@/lib/config';
import type { AuthData } from '@/types';

WebBrowser.maybeCompleteAuthSession();

const schema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta gir'),
  password: z.string().min(1, 'Şifre gerekli'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth, { isLoading: googleLoading }] = useGoogleAuthMutation();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const accessToken = googleResponse.authentication?.accessToken;
    if (!accessToken) return;
    void (async () => {
      try {
        const auth = await googleAuth({ access_token: accessToken }).unwrap();
        await finishSignIn(auth);
      } catch (err) {
        dispatch(addToast(getErrorMessage(err, 'Google ile giriş başarısız'), 'error'));
      }
    })();
  }, [googleResponse]);

  async function finishSignIn(auth: AuthData) {
    await dispatch(signIn(auth)).unwrap();
    router.replace('/(tabs)');
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const auth = await login(values).unwrap();
      await finishSignIn(auth);
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
                placeholder="ornek@email.com"
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

      <View className="flex-row items-center gap-3">
        <View className="flex-1 h-px bg-border" />
        <Text variant="muted" className="text-xs">veya</Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      <View className="gap-3">
        <TouchableOpacity
          onPress={() => void googlePromptAsync()}
          disabled={googleLoading}
          activeOpacity={0.7}
          className="flex-row items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
        >
          <Text className="text-sm font-medium">Google ile devam et</Text>
        </TouchableOpacity>

        <AppleSignInButton onSuccess={finishSignIn} />
      </View>

      <View className="flex-row justify-center gap-1">
        <Text variant="muted">Hesabın yok mu?</Text>
        <Link href="/(auth)/signup" className="text-sm font-medium text-accent">
          Kayıt ol
        </Link>
      </View>
    </Screen>
  );
}
