import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Trash2, X } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { colors } from '@/theme/tokens';
import { formatDate } from '@/lib/formatters';
import { BIRIKIM_CATEGORY_ID } from '@/lib/categoryIcons';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import { LIMITS } from '@/lib/limits';
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from '@/store/api';
import type { Expense, CreateExpensePayload } from '@/types';

export interface SavingsFormSheetRef {
  present: (saving?: Expense) => void;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Birikim formu: peşin/taksit yok. Ne biriktirdin (title: Altın/Dolar/Nakit),
// ne kadar (miktar → note: "1500", "40 gr") ve OPSİYONEL yaklaşık ₺ değeri
// (total_amount). DB değişmez: kayıt kategori 13'lü 'cash' harcamadır.
export const SavingsFormSheet = forwardRef<SavingsFormSheetRef>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const dispatch = useAppDispatch();
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: deleting }] = useDeleteExpenseMutation();

  const [editing, setEditing] = useState<Expense | null>(null);
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const reset = useCallback((saving?: Expense) => {
    if (saving) {
      setEditing(saving);
      setTitle(saving.title);
      setQuantity(saving.note ?? '');
      setAmount(saving.total_amount);
      setDate(new Date(saving.expense_date.slice(0, 10) + 'T00:00:00'));
    } else {
      setEditing(null);
      setTitle('');
      setQuantity('');
      setAmount(0);
      setDate(new Date());
    }
  }, []);

  useImperativeHandle(ref, () => ({
    present: (saving?: Expense) => {
      reset(saving);
      sheetRef.current?.present();
    },
  }), [reset]);

  const close = () => sheetRef.current?.dismiss();

  const onSave = async () => {
    if (!title.trim()) return dispatch(addToast('Ne biriktirdin?', 'warning'));
    if (!quantity.trim()) return dispatch(addToast('Ne kadar biriktirdin?', 'warning'));

    const payload: CreateExpensePayload = {
      title: title.trim(),
      expense_date: toISODate(date),
      payment_type: 'cash',
      category_id: BIRIKIM_CATEGORY_ID,
      note: quantity.trim(),
      items: [{ name: title.trim(), amount }],
    };

    try {
      if (editing) {
        await updateExpense({ id: editing.id, body: payload }).unwrap();
        dispatch(addToast('Birikim güncellendi'));
      } else {
        await createExpense(payload).unwrap();
        dispatch(addToast('Birikim eklendi'));
      }
      close();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, 'Kaydedilemedi'), 'error'));
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert('Birikimi sil', `"${editing.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(editing.id).unwrap();
            dispatch(addToast('Birikim silindi'));
            close();
          } catch (err) {
            dispatch(addToast(getErrorMessage(err, 'Silinemedi'), 'error'));
          }
        },
      },
    ]);
  };

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  const busy = creating || updating || deleting;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['70%']}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView contentContainerClassName="gap-4 px-4 pb-10" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between">
          <Text variant="h2">{editing ? 'Birikimi düzenle' : 'Yeni birikim'}</Text>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kapat" className="p-1 active:opacity-60">
            <Icon icon={X} size={22} color={colors.muted} />
          </Pressable>
        </View>

        <Field label="Ne biriktirdin?">
          <Input bottomSheet value={title} onChangeText={setTitle} maxLength={LIMITS.title} placeholder="Örn. Altın, Dolar, Nakit" />
        </Field>

        <Field label="Ne kadar?">
          <Input bottomSheet value={quantity} onChangeText={setQuantity} maxLength={LIMITS.savingsQuantity} placeholder="Örn. 1500, 40 gr" />
        </Field>

        <Field label="Yaklaşık değer (₺) — opsiyonel">
          <CurrencyInput value={amount} onChangeValue={setAmount} />
        </Field>

        <Field label="Tarih">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="rounded-xl border border-border bg-white px-3 py-3 active:opacity-70"
          >
            <Text variant="body" className="capitalize">{formatDate(toISODate(date))}</Text>
          </Pressable>
        </Field>
        <DatePicker
          visible={showDatePicker}
          value={date}
          onConfirm={setDate}
          onClose={() => setShowDatePicker(false)}
        />

        <Button label={editing ? 'Güncelle' : 'Kaydet'} onPress={onSave} loading={busy} />
        {editing ? (
          <Button label="Sil" variant="danger" leftIcon={Trash2} onPress={onDelete} disabled={busy} />
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

SavingsFormSheet.displayName = 'SavingsFormSheet';
