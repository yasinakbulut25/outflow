import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useResetPasswordMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import { LIMITS } from '@/lib/limits';
import { useTranslation } from '@/i18n';

const schema = z
  .object({
    password: z.string().min(6, 'auth.passwordMin').max(LIMITS.password, 'auth.passwordTooLong'),
    confirm: z.string().min(1, 'auth.reset.confirmRequired'),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'auth.passwordsMismatch',
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { resetToken } = useLocalSearchParams<{ resetToken: string }>();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const { t } = useTranslation();
  const fe = (m?: string) => (m ? t(m) : undefined);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      await resetPassword({ resetToken: resetToken ?? '', newPassword: password }).unwrap();
      dispatch(addToast(t('auth.reset.success'), 'success'));
      router.replace('/(auth)/login');
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, t('auth.reset.failed')), 'error'));
    }
  });

  return (
    <Screen scroll className="gap-8">
      <View className="gap-1">
        <Text variant="h1">{t("auth.reset.title")}</Text>
        <Text variant="muted">{t("auth.reset.subtitle")}</Text>
      </View>

      <View className="gap-4">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field label={t("auth.reset.newLabel")} error={fe(errors.password?.message)}>
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
            <Field label={t("auth.reset.confirmLabel")} error={fe(errors.confirm?.message)}>
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

      <Button label={t("auth.reset.submit")} onPress={onSubmit} loading={isLoading} />
    </Screen>
  );
}
