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
import { useTranslation, useFormat } from '@/i18n';
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
  const { t } = useTranslation();
  const fmt = useFormat();
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
    if (!title.trim()) return dispatch(addToast(t('savings.form.whatRequired'), 'warning'));
    if (!quantity.trim()) return dispatch(addToast(t('savings.form.howMuchRequired'), 'warning'));

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
        dispatch(addToast(t('savings.form.updated')));
      } else {
        await createExpense(payload).unwrap();
        dispatch(addToast(t('savings.form.added')));
      }
      close();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, t('common.saveFailed')), 'error'));
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert(t('savings.form.deleteTitle'), t('common.deleteConfirm', { title: editing.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(editing.id).unwrap();
            dispatch(addToast(t('savings.form.deleted')));
            close();
          } catch (err) {
            dispatch(addToast(getErrorMessage(err, t('common.deleteFailed')), 'error'));
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
          <Text variant="h2">{editing ? t('savings.form.edit') : t('savings.form.create')}</Text>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("a11y.close")} className="p-1 active:opacity-60">
            <Icon icon={X} size={22} color={colors.muted} />
          </Pressable>
        </View>

        <Field label={t("savings.form.what")}>
          <Input bottomSheet value={title} onChangeText={setTitle} maxLength={LIMITS.title} placeholder={t("savings.form.whatPlaceholder")} />
        </Field>

        <Field label={t("savings.form.howMuch")}>
          <Input bottomSheet value={quantity} onChangeText={setQuantity} maxLength={LIMITS.savingsQuantity} placeholder={t("savings.form.howMuchPlaceholder")} />
        </Field>

        <Field label={t("savings.form.approxValue", { symbol: fmt.symbol })}>
          <CurrencyInput value={amount} onChangeValue={setAmount} />
        </Field>

        <Field label={t("savings.form.date")}>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="rounded-xl border border-border bg-white px-3 py-3 active:opacity-70"
          >
            <Text variant="body" className="capitalize">{fmt.date(toISODate(date))}</Text>
          </Pressable>
        </Field>
        <DatePicker
          visible={showDatePicker}
          value={date}
          onConfirm={setDate}
          onClose={() => setShowDatePicker(false)}
        />

        <Button label={editing ? t('common.update') : t('common.save')} onPress={onSave} loading={busy} />
        {editing ? (
          <Button label={t("common.delete")} variant="danger" leftIcon={Trash2} onPress={onDelete} disabled={busy} />
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

SavingsFormSheet.displayName = 'SavingsFormSheet';
