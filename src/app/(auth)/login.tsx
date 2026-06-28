import AppleSignInButton from "@/components/AppleSignInButton";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { SocialButton } from "@/components/ui/SocialButton";
import { GoogleLogo } from "@/components/ui/BrandLogos";
import { Text } from "@/components/ui/Text";
import { getErrorMessage } from "@/lib/apiError";
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from "@/lib/config";
import { useGoogleAuthMutation, useLoginMutation } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { signIn } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import type { AuthData } from "@/types";
import { LIMITS } from "@/lib/limits";
import { enableMockSession, isMockCredentials } from "@/lib/mockBackend";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Google from "expo-auth-session/providers/google";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, View } from "react-native";
import { z } from "zod";
import { useTranslation } from "@/i18n";

WebBrowser.maybeCompleteAuthSession();

const LOGO = require("../../../assets/images/icon.png");

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "auth.emailRequired")
    .max(LIMITS.email, "auth.emailTooLong")
    .email("auth.emailInvalid"),
  password: z.string().min(1, "auth.passwordRequired").max(LIMITS.password, "auth.passwordTooLong"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth, { isLoading: googleLoading }] = useGoogleAuthMutation();
  const { t } = useTranslation();
  const fe = (m?: string) => (m ? t(m) : undefined);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type !== "success") return;
    const accessToken = googleResponse.authentication?.accessToken;
    if (!accessToken) return;
    void (async () => {
      try {
        const auth = await googleAuth({ access_token: accessToken }).unwrap();
        await finishSignIn(auth);
      } catch (err) {
        dispatch(
          addToast(getErrorMessage(err, t("auth.login.googleFailed")), "error"),
        );
      }
    })();
  }, [googleResponse]);

  async function finishSignIn(auth: AuthData) {
    await dispatch(signIn(auth)).unwrap();
    router.replace("/(tabs)");
  }

  const onSubmit = handleSubmit(async (values) => {
    // Demo bilgileri → bu oturum mock backend'e yönlensin (login isteği dahil).
    // Tek bir normal production build app-review'da demo hesapla çalışsın diye runtime'da açılır.
    if (isMockCredentials(values.email, values.password)) enableMockSession();
    try {
      const auth = await login(values).unwrap();
      await finishSignIn(auth);
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, t("auth.login.failed")), "error"));
    }
  });

  return (
    <Screen scroll className="justify-center gap-8">
      <View className="items-center gap-4">
        <Image
          source={LOGO}
          style={{
            width: 76,
            height: 76,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 14,
          }}
        />
        <View className="items-center gap-1">
          <Text variant="h1">Outflow</Text>
          <Text variant="muted">{t("auth.login.subtitle")}</Text>
        </View>
      </View>

      <View className="gap-4">
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
                autoComplete="current-password"
                maxLength={LIMITS.password}
                placeholder="••••••••"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            </Field>
          )}
        />
        <View className="flex-row justify-end">
          <Link href="/(auth)/forgot-password" className="text-sm font-medium text-accent">
            {t("auth.login.forgot")}
          </Link>
        </View>
      </View>

      <Button label={t("auth.login.submit")} onPress={onSubmit} loading={isLoading} />

      <View className="flex-row items-center gap-3">
        <View className="flex-1 h-px bg-border" />
        <Text variant="muted" className="text-xs">
          {t("common.or")}
        </Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      <View className="gap-3">
        <SocialButton
          label={t("auth.login.google")}
          logo={<GoogleLogo size={18} />}
          onPress={() => void googlePromptAsync()}
          loading={googleLoading}
        />

        <AppleSignInButton onSuccess={finishSignIn} />
      </View>

      <View className="flex-row justify-center gap-1">
        <Text variant="muted">{t("auth.login.noAccount")}</Text>
        <Link href="/(auth)/signup" className="text-sm font-medium text-accent">
          {t("auth.login.signup")}
        </Link>
      </View>
    </Screen>
  );
}
