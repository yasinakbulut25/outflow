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

const nameSchema = z.object({
  name: z.string().trim().min(1, "Ad gerekli").max(LIMITS.name, "Ad çok uzun"),
});
type NameValues = z.infer<typeof nameSchema>;

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Mevcut şifre gerekli")
      .max(LIMITS.password, "Şifre çok uzun"),
    newPassword: z
      .string()
      .min(6, "En az 6 karakter")
      .max(LIMITS.password, "Şifre çok uzun"),
    confirm: z.string().min(1, "Yeni şifreyi tekrar gir"),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ["confirm"],
    message: "Şifreler eşleşmiyor",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [busy, setBusy] = useState(false);

  const [updateProfile, { isLoading: savingName }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: savingPassword }] =
    useChangePasswordMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();

  const name = user?.name?.trim() || "Hesabım";
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
      dispatch(addToast("Adın güncellendi", "success"));
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Ad güncellenemedi"), "error"));
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      passwordForm.reset({ currentPassword: "", newPassword: "", confirm: "" });
      dispatch(addToast("Şifren güncellendi", "success"));
    } catch (err) {
      dispatch(
        addToast(getErrorMessage(err, "Şifre değiştirilemedi"), "error"),
      );
    }
  });

  const onLogout = () => {
    Alert.alert("Çıkış yap", "Oturumu kapatmak istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış yap",
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
      "Hesabı sil",
      "Hesabın ve tüm verilerin (harcamalar, gelirler, tekrarlayan kayıtlar) kalıcı olarak silinecek. Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Hesabı sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount().unwrap();
              await dispatch(signOut());
              router.replace("/(auth)/login");
              dispatch(addToast("Hesabın silindi", "success"));
            } catch (err) {
              dispatch(
                addToast(getErrorMessage(err, "Hesap silinemedi"), "error"),
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
          accessibilityLabel="Geri"
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-60"
        >
          <Icon icon={ChevronLeft} size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="h1">Profil</Text>
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
          <Text variant="label">Ad</Text>
          <Controller
            control={nameForm.control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field error={nameForm.formState.errors.name?.message}>
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  invalid={!!nameForm.formState.errors.name}
                  autoComplete="name"
                  maxLength={LIMITS.name}
                  placeholder="Adın"
                  returnKeyType="done"
                  onSubmitEditing={onSaveName}
                />
              </Field>
            )}
          />
          <Button
            label="Adı kaydet"
            onPress={onSaveName}
            loading={savingName}
          />
        </View>

        {!canChangePassword ? (
          <View className="gap-3">
            <Text variant="label">Şifre</Text>
            <Card className="flex-row items-start gap-3">
              <Icon icon={ShieldCheck} size={20} color={colors.muted} />
              <Text variant="muted" className="flex-1">
                Hesabın Google veya Apple ile bağlı olduğundan uygulama içinde
                ayrı bir şifren yok. Giriş yöntemini bağlı olduğun hesap üzerinden
                yönetebilirsin.
              </Text>
            </Card>
          </View>
        ) : (
        <View className="gap-3">
          <Text variant="label">Şifre değiştir</Text>
          <Controller
            control={passwordForm.control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label="Mevcut şifre"
                error={passwordForm.formState.errors.currentPassword?.message}
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
                label="Yeni şifre"
                error={passwordForm.formState.errors.newPassword?.message}
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
                label="Yeni şifre (tekrar)"
                error={passwordForm.formState.errors.confirm?.message}
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
            label="Şifreyi değiştir"
            variant="secondary"
            onPress={onChangePassword}
            loading={savingPassword}
          />
        </View>
        )}

        <Button
          label="Çıkış yap"
          variant="danger"
          leftIcon={LogOut}
          onPress={onLogout}
          loading={busy}
        />

        <View className="mt-2 gap-3 border-t border-border pt-6">
          <Text variant="label" style={{ color: colors.danger }}>
            Tehlikeli bölge
          </Text>
          <Text variant="muted">
            Hesabını silersen tüm verilerin kalıcı olarak kaldırılır. Bu işlem
            geri alınamaz.
          </Text>
          <Button
            label="Hesabı sil"
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
