import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { DatePicker } from '@/components/ui/DatePicker';
import { Trash2, X } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { colors } from '@/theme/tokens';
import { formatDate } from '@/lib/formatters';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import {
  useCreateIncomeMutation,
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
} from '@/store/api';
import type { Income, CreateIncomePayload } from '@/types';

export interface IncomeFormSheetRef {
  present: (income?: Income) => void;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const IncomeFormSheet = forwardRef<IncomeFormSheetRef>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const dispatch = useAppDispatch();
  const [createIncome, { isLoading: creating }] = useCreateIncomeMutation();
  const [updateIncome, { isLoading: updating }] = useUpdateIncomeMutation();
  const [deleteIncome, { isLoading: deleting }] = useDeleteIncomeMutation();

  const [editing, setEditing] = useState<Income | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const reset = useCallback((income?: Income) => {
    if (income) {
      setEditing(income);
      setTitle(income.title);
      setAmount(income.amount);
      setDate(new Date(income.income_date.slice(0, 10) + 'T00:00:00'));
      setNote(income.note ?? '');
    } else {
      setEditing(null);
      setTitle('');
      setAmount(0);
      setDate(new Date());
      setNote('');
    }
  }, []);

  useImperativeHandle(ref, () => ({
    present: (income?: Income) => {
      reset(income);
      sheetRef.current?.present();
    },
  }), [reset]);

  const close = () => sheetRef.current?.dismiss();

  const onSave = async () => {
    if (!title.trim()) return dispatch(addToast('Başlık gerekli', 'warning'));
    if (amount <= 0) return dispatch(addToast('Tutar gir', 'warning'));

    const payload: CreateIncomePayload = {
      title: title.trim(),
      amount,
      income_date: toISODate(date),
      note: note.trim() || undefined,
    };

    try {
      if (editing) {
        await updateIncome({ id: editing.id, body: payload }).unwrap();
        dispatch(addToast('Gelir güncellendi'));
      } else {
        await createIncome(payload).unwrap();
        dispatch(addToast('Gelir eklendi'));
      }
      close();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, 'Kaydedilemedi'), 'error'));
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert('Geliri sil', `"${editing.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIncome(editing.id).unwrap();
            dispatch(addToast('Gelir silindi'));
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
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView contentContainerClassName="gap-4 px-4 pb-10" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between">
          <Text variant="h2">{editing ? 'Geliri düzenle' : 'Yeni gelir'}</Text>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kapat" className="p-1 active:opacity-60">
            <Icon icon={X} size={22} color={colors.muted} />
          </Pressable>
        </View>

        <Field label="Başlık">
          <Input value={title} onChangeText={setTitle} placeholder="Örn. Ek iş ödemesi" />
        </Field>

        <Field label="Tutar">
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

        <Field label="Not (opsiyonel)">
          <Input value={note} onChangeText={setNote} placeholder="Açıklama" />
        </Field>

        <Button label={editing ? 'Güncelle' : 'Kaydet'} onPress={onSave} loading={busy} />
        {editing ? (
          <Button label="Sil" variant="danger" leftIcon={Trash2} onPress={onDelete} disabled={busy} />
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

IncomeFormSheet.displayName = 'IncomeFormSheet';
