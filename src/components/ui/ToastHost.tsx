import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeToast, type Toast as ToastModel, type ToastType } from '@/store/slices/uiSlice';

const TONE: Record<ToastType, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-danger',
};

const HAPTIC: Record<ToastType, () => void> = {
  success: haptics.success,
  warning: haptics.warning,
  error: haptics.error,
};

function ToastItem({ toast }: { toast: ToastModel }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    HAPTIC[toast.type]();
    const t = setTimeout(() => dispatch(removeToast(toast.id)), 2800);
    return () => clearTimeout(t);
  }, [dispatch, toast.id, toast.type]);

  return (
    <Pressable onPress={() => dispatch(removeToast(toast.id))} className={cn('rounded-xl px-4 py-3', TONE[toast.type])}>
      <Text className="text-white font-medium">{toast.message}</Text>
    </Pressable>
  );
}

export function ToastHost() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12 }} className="gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}
