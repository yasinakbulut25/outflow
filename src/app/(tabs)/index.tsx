import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { colors } from '@/theme/tokens';

export default function ExpensesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ExpenseList />
    </SafeAreaView>
  );
}
