import { useRef } from 'react';
import { View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Plus, Repeat } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { RecurringCard } from '@/components/recurring/RecurringCard';
import { RecurringFormSheet, type RecurringFormSheetRef } from '@/components/recurring/RecurringFormSheet';
import { useGetRecurringQuery } from '@/store/api';
import { colors } from '@/theme/tokens';

export default function RecurringScreen() {
  const sheetRef = useRef<RecurringFormSheetRef>(null);
  const { data, isLoading, isFetching, refetch } = useGetRecurringQuery();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {isLoading ? (
        <View className="flex-1 px-4 pt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={data ?? []}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => (
            <RecurringCard template={item} onPress={(t) => sheetRef.current?.present(t)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          ListHeaderComponent={<Text variant="h1" className="mb-3">Düzenli ödemeler</Text>}
          ListEmptyComponent={<EmptyState message="Henüz düzenli ödeme yok." icon={Repeat} />}
          refreshing={isFetching}
          onRefresh={refetch}
        />
      )}

      <Pressable
        onPress={() => sheetRef.current?.present()}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-accent active:opacity-80"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <Icon icon={Plus} size={26} color={colors.white} />
      </Pressable>

      <RecurringFormSheet ref={sheetRef} />
    </SafeAreaView>
  );
}
