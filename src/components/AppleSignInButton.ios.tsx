import * as AppleAuthentication from 'expo-apple-authentication';
import { useState, useEffect } from 'react';
import { useAppleAuthMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import type { AppleSignInButtonProps } from './AppleSignInButton';

export default function AppleSignInButton({ onSuccess }: AppleSignInButtonProps) {
  const dispatch = useAppDispatch();
  const [appleAuth] = useAppleAuthMutation();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  if (!available) return null;

  const onPress = async () => {
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
      dispatch(addToast(getErrorMessage(err, 'Apple ile giriş başarısız'), 'error'));
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={{ height: 48 }}
      onPress={onPress}
    />
  );
}
