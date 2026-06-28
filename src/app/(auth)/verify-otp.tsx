import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useForgotPasswordMutation, useVerifyOtpMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import { isMockSessionActive, MOCK_OTP } from '@/lib/mockBackend';
import { colors } from '@/theme/tokens';
import { useTranslation } from '@/i18n';

const RESEND_COOLDOWN = 60; // saniye — backend cooldown'u ile uyumlu

const schema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'auth.otp.invalid'),
});
type FormValues = z.infer<typeof schema>;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [forgotPassword, { isLoading: resending }] = useForgotPasswordMutation();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const { t } = useTranslation();
  const fe = (m?: string) => (m ? t(m) : undefined);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onSubmit = handleSubmit(async ({ code }) => {
    try {
      const { resetToken } = await verifyOtp({ email: email ?? '', code }).unwrap();
      router.push({ pathname: '/(auth)/reset-password', params: { resetToken } });
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, t('auth.otp.verifyFailed')), 'error'));
    }
  });

  const onResend = async () => {
    if (cooldown > 0) return;
    try {
      await forgotPassword({ email: email ?? '' }).unwrap();
      setCooldown(RESEND_COOLDOWN);
      dispatch(addToast(t('auth.otp.resent'), 'success'));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, t('auth.otp.sendFailed')), 'error'));
    }
  };

  return (
    <Screen scroll className="gap-8">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("a11y.back")}
        hitSlop={8}
        className="h-9 w-9 -ml-1 items-center justify-center rounded-full active:opacity-60"
      >
        <Icon icon={ChevronLeft} size={24} color={colors.foreground} />
      </Pressable>

      <View className="gap-1">
        <Text variant="h1">{t("auth.otp.title")}</Text>
        <Text variant="muted">
          {email ? t('auth.otp.descWithEmail', { email }) : t('auth.otp.descNoEmail')}
        </Text>
        {isMockSessionActive() ? (
          <Text variant="muted" className="mt-1 text-accent">{t("auth.otp.demo", { code: MOCK_OTP })}</Text>
        ) : null}
      </View>

      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, onBlur, value } }) => (
          <Field label={t("auth.otp.label")} error={fe(errors.code?.message)}>
            <Input
              value={value}
              onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
              onBlur={onBlur}
              invalid={!!errors.code}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              placeholder="000000"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
          </Field>
        )}
      />

      <Button label={t("auth.otp.submit")} onPress={onSubmit} loading={isLoading} />

      <Pressable onPress={onResend} disabled={cooldown > 0 || resending} hitSlop={8} className="items-center">
        <Text variant="muted" className={cooldown > 0 ? '' : 'text-accent'}>
          {cooldown > 0 ? t('auth.otp.resendCountdown', { count: cooldown }) : t('auth.otp.resend')}
        </Text>
      </Pressable>
    </Screen>
  );
}
