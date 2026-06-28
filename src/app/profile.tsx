import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { getErrorMessage } from "@/lib/apiError";
import { LIMITS } from "@/lib/limits";
import {
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useUpdateProfileMutation,
} from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signOut, updateUser } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { colors } from "@/theme/tokens";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ChevronLeft, LogOut, ShieldCheck, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useTranslation } from "@/i18n";
import { LANGUAGES, CURRENCIES, CURRENCY_SYMBOL } from "@/i18n/locale";
import { setLanguage, setCurrency } from "@/store/slices/settingsSlice";

const nameSchema = z.object({
  name: z.string().trim().min(1, "auth.nameRequired").max(LIMITS.name, "auth.nameTooLong"),
});
type NameValues = z.infer<typeof nameSchema>;

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "profile.currentPasswordRequired")
      .max(LIMITS.password, "auth.passwordTooLong"),
    newPassword: z
      .string()
      .min(6, "auth.passwordMin")
      .max(LIMITS.password, "auth.passwordTooLong"),
    confirm: z.string().min(1, "profile.newPasswordConfirmRequired"),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ["confirm"],
    message: "auth.passwordsMismatch",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, language, currency } = useTranslation();
  const fe = (m?: string) => (m ? t(m) : undefined);
  const user = useAppSelector((s) => s.auth.user);
  const [busy, setBusy] = useState(false);

  const [updateProfile, { isLoading: savingName }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: savingPassword }] =
    useChangePasswordMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();

  const name = user?.name?.trim() || t("profile.defaultName");
  const email = user?.email?.trim() || "";
  // Google/Apple ile giren kullanıcıların uygulama içi şifresi yok → şifre
  // değiştirme bölümünü gizle. Alan yoksa (eski backend) şifresi var kabul edilir.
  const canChangePassword = user?.hasPassword !== false;
  const initial = (
    user?.name?.trim()?.[0] ??
    user?.email?.trim()?.[0] ??
    "?"
  ).toUpperCase();

  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });

  const onSaveName = nameForm.handleSubmit(async (values) => {
    try {
      const updated = await updateProfile({ name: values.name }).unwrap();
      await dispatch(updateUser(updated)).unwrap();
      nameForm.reset({ name: updated.name ?? values.name });
      dispatch(addToast(t("profile.nameUpdated"), "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, t("profile.nameUpdateFailed")), "error"));
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      passwordForm.reset({ currentPassword: "", newPassword: "", confirm: "" });
      dispatch(addToast(t("profile.passwordUpdated"), "success"));
    } catch (err) {
      dispatch(
        addToast(getErrorMessage(err, t("profile.passwordChangeFailed")), "error"),
      );
    }
  });

  const onLogout = () => {
    Alert.alert(t("profile.logout"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          await dispatch(signOut());
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const onDeleteAccount = () => {
    Alert.alert(
      t("profile.deleteAccount"),
      t("profile.deleteAccountConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.deleteAccount"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount().unwrap();
              await dispatch(signOut());
              router.replace("/(auth)/login");
              dispatch(addToast(t("profile.accountDeleted"), "success"));
            } catch (err) {
              dispatch(
                addToast(getErrorMessage(err, t("profile.accountDeleteFailed")), "error"),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View className="flex-row items-center gap-2 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("a11y.back")}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
        >
          <Icon icon={ChevronLeft} size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="h1">{t("profile.title")}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-2 pb-8 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full border border-border bg-surface">
            <Text variant="h2">{initial}</Text>
          </View>
          <View className="flex-1">
            <Text variant="h2" numberOfLines={1}>
              {name}
            </Text>
            {email ? (
              <Text variant="muted" numberOfLines={1} className="mt-0.5">
                {email}
              </Text>
            ) : null}
          </View>
        </Card>

        <View className="gap-3">
          <Text variant="label">{t("profile.nameLabel")}</Text>
          <Controller
            control={nameForm.control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field error={fe(nameForm.formState.errors.name?.message)}>
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  invalid={!!nameForm.formState.errors.name}
                  autoComplete="name"
                  maxLength={LIMITS.name}
                  placeholder={t("profile.namePlaceholder")}
                  returnKeyType="done"
                  onSubmitEditing={onSaveName}
                />
              </Field>
            )}
          />
          <Button
            label={t("profile.saveName")}
            onPress={onSaveName}
            loading={savingName}
          />
        </View>

        {!canChangePassword ? (
          <View className="gap-3">
            <Text variant="label">{t("profile.passwordSection")}</Text>
            <Card className="flex-row items-start gap-3">
              <Icon icon={ShieldCheck} size={20} color={colors.muted} />
              <Text variant="muted" className="flex-1">
                {t("profile.oauthNotice")}
              </Text>
            </Card>
          </View>
        ) : (
        <View className="gap-3">
          <Text variant="label">{t("profile.changePassword")}</Text>
          <Controller
            control={passwordForm.control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label={t("profile.currentPassword")}
                error={fe(passwordForm.formState.errors.currentPassword?.message)}
              >
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  invalid={!!passwordForm.formState.errors.currentPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  maxLength={LIMITS.password}
                  placeholder="••••••••"
                  returnKeyType="next"
                />
              </Field>
            )}
          />
          <Controller
            control={passwordForm.control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label={t("profile.newPassword")}
                error={fe(passwordForm.formState.errors.newPassword?.message)}
              >
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  invalid={!!passwordForm.formState.errors.newPassword}
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
            control={passwordForm.control}
            name="confirm"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label={t("profile.newPasswordConfirm")}
                error={fe(passwordForm.formState.errors.confirm?.message)}
              >
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  invalid={!!passwordForm.formState.errors.confirm}
                  secureTextEntry
                  autoComplete="password-new"
                  maxLength={LIMITS.password}
                  placeholder="••••••••"
                  returnKeyType="done"
                  onSubmitEditing={onChangePassword}
                />
              </Field>
            )}
          />
          <Button
            label={t("profile.changePasswordBtn")}
            variant="secondary"
            onPress={onChangePassword}
            loading={savingPassword}
          />
        </View>
        )}

        <View className="gap-3">
          <Text variant="label">{t("profile.language")}</Text>
          <View className="flex-row rounded-xl border border-border bg-surface p-1">
            {LANGUAGES.map((lng) => {
              const active = language === lng;
              return (
                <Pressable
                  key={lng}
                  onPress={() => dispatch(setLanguage(lng))}
                  className={`flex-1 items-center rounded-xl py-2 active:opacity-70 ${active ? "bg-accent" : ""}`}
                >
                  <Text className={`font-medium ${active ? "text-white" : "text-muted"}`}>
                    {lng === "tr" ? t("profile.languageNameTr") : t("profile.languageNameEn")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <Text variant="label">{t("profile.currency")}</Text>
          <View className="flex-row rounded-xl border border-border bg-surface p-1">
            {CURRENCIES.map((cur) => {
              const active = currency === cur;
              return (
                <Pressable
                  key={cur}
                  onPress={() => dispatch(setCurrency(cur))}
                  className={`flex-1 items-center rounded-xl py-2 active:opacity-70 ${active ? "bg-accent" : ""}`}
                >
                  <Text className={`font-medium ${active ? "text-white" : "text-muted"}`}>
                    {CURRENCY_SYMBOL[cur]} {cur}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          label={t("profile.logout")}
          variant="danger"
          leftIcon={LogOut}
          onPress={onLogout}
          loading={busy}
        />

        <View className="mt-2 gap-3 border-t border-border pt-6">
          <Text variant="label" style={{ color: colors.danger }}>
            {t("profile.dangerZone")}
          </Text>
          <Text variant="muted">
            {t("profile.dangerNote")}
          </Text>
          <Button
            label={t("profile.deleteAccount")}
            variant="danger"
            leftIcon={Trash2}
            onPress={onDeleteAccount}
            loading={deleting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
