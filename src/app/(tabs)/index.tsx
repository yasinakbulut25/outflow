import { useRef } from 'react';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseFormSheet, type ExpenseFormSheetRef } from '@/components/expenses/ExpenseFormSheet';
import { SavingsFormSheet, type SavingsFormSheetRef } from '@/components/savings/SavingsFormSheet';
import { RecurringFormSheet, type RecurringFormSheetRef } from '@/components/recurring/RecurringFormSheet';
import { Icon } from '@/components/ui/Icon';
import { useGetRecurringQuery } from '@/store/api';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme/tokens';

export default function ExpensesScreen() {
  const sheetRef = useRef<ExpenseFormSheetRef>(null);
  const savingsSheet = useRef<SavingsFormSheetRef>(null);
  const recurringSheet = useRef<RecurringFormSheetRef>(null);
  // Düzenli ödeme occurrence'ına dokununca şablonu açabilmek için şablon listesi.
  const { data: templates } = useGetRecurringQuery();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ExpenseList
        onPressExpense={(e) => sheetRef.current?.present(e)}
        onPressSaving={(e) => savingsSheet.current?.present(e)}
        onPressRecurring={(id) => {
          const tpl = templates?.find((t) => t.id === id);
          if (tpl) recurringSheet.current?.present(tpl);
        }}
      />

      <Pressable
        onPress={() => {
          haptics.light();
          sheetRef.current?.present();
        }}
        accessibilityRole="button"
        accessibilityLabel="Yeni harcama ekle"
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

      <ExpenseFormSheet ref={sheetRef} />
      <SavingsFormSheet ref={savingsSheet} />
      <RecurringFormSheet ref={recurringSheet} />
    </SafeAreaView>
  );
}
