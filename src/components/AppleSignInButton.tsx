import type { AuthData } from '@/types';

export interface AppleSignInButtonProps {
  onSuccess: (auth: AuthData) => Promise<void>;
}

export default function AppleSignInButton(_props: AppleSignInButtonProps) {
  return null;
}
