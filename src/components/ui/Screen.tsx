import type { ReactNode } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
  /** Üst güvenli alan boşluğu uygulansın mı. Üstte bir navbar/header varsa false ver
   *  (aksi halde çift boşluk oluşur). Varsayılan true (örn. auth ekranları). */
  safeTop?: boolean;
}

export function Screen({ children, scroll, refreshing, onRefresh, className, safeTop = true }: ScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={safeTop ? ['top'] : []}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn('px-4 py-4', className)}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1 px-4 py-4', className)}>{children}</View>
      )}
    </SafeAreaView>
  );
}
