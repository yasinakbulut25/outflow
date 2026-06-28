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
import { LIMITS } from '@/lib/limits';
import { useTranslation } from '@/i18n';

const schema = z
  .object({
    name: z.string().trim().min(1, 'auth.nameRequired').max(LIMITS.name, 'auth.nameTooLong'),
    email: z
      .string()
      .trim()
      .min(1, 'auth.emailRequired')
      .max(LIMITS.email, 'auth.emailTooLong')
      .email('auth.emailInvalid'),
    password: z
      .string()
      .min(6, 'auth.passwordMin')
      .max(LIMITS.password, 'auth.passwordTooLong'),
    confirm: z.string().min(1, 'auth.signup.confirmRequired'),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'auth.passwordsMismatch',
  });
type FormValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { t } = useTranslation();
  const fe = (m?: string) => (m ? t(m) : undefined);
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const auth = await register({
        email: values.email,
        password: values.password,
        name: values.name,
      }).unwrap();
      await dispatch(signIn(auth)).unwrap();
      router.replace('/(tabs)');
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, t('auth.signup.failed')), 'error'));
    }
  });

  return (
    <Screen scroll className="justify-center gap-6">
      <View className="gap-1">
        <Text variant="h1">{t("auth.signup.title")}</Text>
        <Text variant="muted">{t("auth.signup.subtitle")}</Text>
      </View>

      <View className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field label={t("auth.signup.nameLabel")} error={fe(errors.name?.message)}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                invalid={!!errors.name}
                autoComplete="name"
                maxLength={LIMITS.name}
                placeholder={t("auth.signup.namePlaceholder")}
                returnKeyType="next"
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field label={t("auth.emailLabel")} error={fe(errors.email?.message)}>
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
                placeholder={t("auth.emailPlaceholder")}
                returnKeyType="next"
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field label={t("auth.passwordLabel")} error={fe(errors.password?.message)}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                invalid={!!errors.password}
                secureTextEntry
                autoComplete="password-new"
                maxLength={LIMITS.password}
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
            <Field label={t("auth.signup.confirmLabel")} error={fe(errors.confirm?.message)}>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                invalid={!!errors.confirm}
                secureTextEntry
                autoComplete="password-new"
                maxLength={LIMITS.password}
                placeholder="••••••••"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            </Field>
          )}
        />
      </View>

      <Button label={t("auth.signup.submit")} onPress={onSubmit} loading={isLoading} />

      <View className="flex-row justify-center gap-1">
        <Text variant="muted">{t("auth.signup.hasAccount")}</Text>
        <Link href="/(auth)/login" className="text-sm font-medium text-accent">
          {t("auth.signup.login")}
        </Link>
      </View>
    </Screen>
  );
}
