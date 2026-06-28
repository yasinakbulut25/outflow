import * as AppleAuthentication from 'expo-apple-authentication';
import { useState, useEffect } from 'react';
import { useAppleAuthMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import { SocialButton } from '@/components/ui/SocialButton';
import { AppleLogo } from '@/components/ui/BrandLogos';
import { useTranslation } from '@/i18n';
import type { AppleSignInButtonProps } from './AppleSignInButton';

export default function AppleSignInButton({ onSuccess }: AppleSignInButtonProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [appleAuth] = useAppleAuthMutation();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  if (!available) return null;

  const onPress = async () => {
    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('identity_token alınamadı');
      const auth = await appleAuth({
        identity_token: credential.identityToken,
        full_name: credential.fullName
          ? {
              givenName: credential.fullName.givenName ?? undefined,
              familyName: credential.fullName.familyName ?? undefined,
            }
          : null,
      }).unwrap();
      await onSuccess(auth);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      dispatch(addToast(getErrorMessage(err, t('auth.login.appleFailed')), 'error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SocialButton
      label={t("auth.login.apple")}
      logo={<AppleLogo size={18} />}
      onPress={onPress}
      loading={busy}
    />
  );
}
