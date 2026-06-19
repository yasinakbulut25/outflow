import { Fragment, useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, TriangleAlert, XCircle, type LucideIcon } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeToast, type Toast as ToastModel, type ToastType } from '@/store/slices/uiSlice';

const TONE: Record<ToastType, string> = {
  success: colors.success,
  warning: colors.warning,
  error: colors.danger,
};

const TOAST_ICON: Record<ToastType, LucideIcon> = {
  success: CheckCircle2,
  warning: TriangleAlert,
  error: XCircle,
};

const HAPTIC: Record<ToastType, () => void> = {
  success: haptics.success,
  warning: haptics.warning,
  error: haptics.error,
};

function ToastItem({ toast }: { toast: ToastModel }) {
  const dispatch = useAppDispatch();
  const tone = TONE[toast.type];

  useEffect(() => {
    HAPTIC[toast.type]();
    const t = setTimeout(() => dispatch(removeToast(toast.id)), 2800);
    return () => clearTimeout(t);
  }, [dispatch, toast.id, toast.type]);

  return (
    <Animated.View
      entering={FadeInUp.duration(260)}
      exiting={FadeOutUp.duration(200)}
      layout={LinearTransition.duration(220)}
      // iOS: yumuşak gölge · Android: kartı sheet'in üstüne taşıyan yüksek elevation.
      style={{
        shadowColor: colors.foreground,
        shadowOpacity: 0.14,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 24,
      }}
    >
      <Pressable
        onPress={() => dispatch(removeToast(toast.id))}
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-2xl border border-border bg-white px-3.5 py-3 active:opacity-90"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${tone}1A` }}
        >
          <Icon icon={TOAST_ICON[toast.type]} size={20} color={tone} />
        </View>
        <Text className="flex-1 font-medium text-foreground">{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ToastHost() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;

  // iOS'ta FullWindowOverlay, toast'ı bottom-sheet/modal ve klavyenin de ÜSTÜNDE,
  // ayrı bir pencerede çizer; dokunuşlar kartlar dışında alta geçer (ekranı bloklamaz).
  // Android'de aynı pencerede yüksek zIndex/elevation ile en öne alınır.
  const Overlay = Platform.OS === 'ios' ? FullWindowOverlay : Fragment;

  return (
    <Overlay>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, zIndex: 9999 }}
        className="gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </View>
    </Overlay>
  );
}
