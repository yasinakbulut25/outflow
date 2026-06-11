import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View, Pressable, Alert, Switch } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { DatePicker } from '@/components/ui/DatePicker';
import { Trash2, X } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import { formatDate } from '@/lib/formatters';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import { LIMITS } from '@/lib/limits';
import {
  useCreateIncomeMutation,
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
  useCreateRecurringIncomeMutation,
  useUpdateRecurringIncomeMutation,
  useDeleteRecurringIncomeMutation,
} from '@/store/api';
import type {
  Income,
  RecurringIncomeTemplate,
  CreateIncomePayload,
  CreateRecurringIncomePayload,
} from '@/types';

export interface IncomeFormSheetRef {
  // Boş → yeni; { income } → tek seferlik düzenle; { template } → düzenli geliri düzenle
  present: (opts?: { income?: Income; template?: RecurringIncomeTemplate }) => void;
}

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type PickerTarget = 'date' | 'start' | 'end' | null;

export const IncomeFormSheet = forwardRef<IncomeFormSheetRef>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const dispatch = useAppDispatch();
  const [createIncome, { isLoading: c1 }] = useCreateIncomeMutation();
  const [updateIncome, { isLoading: u1 }] = useUpdateIncomeMutation();
  const [deleteIncome, { isLoading: d1 }] = useDeleteIncomeMutation();
  const [createTpl, { isLoading: c2 }] = useCreateRecurringIncomeMutation();
  const [updateTpl, { isLoading: u2 }] = useUpdateRecurringIncomeMutation();
  const [deleteTpl, { isLoading: d2 }] = useDeleteRecurringIncomeMutation();

  // Düzenleme modu: tek seferlik gelir VEYA düzenli şablon (ikisi de null → yeni)
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [editTpl, setEditTpl] = useState<RecurringIncomeTemplate | null>(null);
  const [repeat, setRepeat] = useState(false);

  // Ortak alanlar
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  // Tek seferlik
  const [date, setDate] = useState(() => new Date());
  // Düzenli
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [active, setActive] = useState(true);

  const [picker, setPicker] = useState<PickerTarget>(null);

  const reset = useCallback((opts?: { income?: Income; template?: RecurringIncomeTemplate }) => {
    const income = opts?.income;
    const tpl = opts?.template;

    setTitle(income?.title ?? tpl?.title ?? '');
    setAmount(income?.amount ?? tpl?.amount ?? 0);
    setNote(income?.note ?? tpl?.note ?? '');

    setDate(income ? new Date(income.income_date.slice(0, 10) + 'T00:00:00') : new Date());

    setDayOfMonth(tpl?.day_of_month ?? 1);
    setStartDate(tpl ? new Date(tpl.start_date.slice(0, 10) + 'T00:00:00') : new Date());
    setEndDate(tpl?.end_date ? new Date(tpl.end_date.slice(0, 10) + 'T00:00:00') : null);
    setActive(tpl?.active ?? true);

    setEditIncome(income ?? null);
    setEditTpl(tpl ?? null);
    setRepeat(!!tpl);
  }, []);

  useImperativeHandle(ref, () => ({
    present: (opts) => {
      reset(opts);
      sheetRef.current?.present();
    },
  }), [reset]);

  const close = () => sheetRef.current?.dismiss();
  const isEditing = !!editIncome || !!editTpl;

  const onSave = async () => {
    if (!title.trim()) return dispatch(addToast('Başlık gerekli', 'warning'));
    if (amount <= 0) return dispatch(addToast('Tutar gir', 'warning'));

    try {
      if (repeat) {
        const payload: CreateRecurringIncomePayload = {
          title: title.trim(),
          amount,
          day_of_month: dayOfMonth,
          start_date: toISODate(startDate),
          end_date: endDate ? toISODate(endDate) : null,
          note: note.trim() || undefined,
        };
        if (editTpl) {
          await updateTpl({ id: editTpl.id, body: { ...payload, active } }).unwrap();
          dispatch(addToast('Düzenli gelir güncellendi'));
        } else {
          await createTpl(payload).unwrap();
          dispatch(addToast('Düzenli gelir eklendi'));
        }
      } else {
        const payload: CreateIncomePayload = {
          title: title.trim(),
          amount,
          income_date: toISODate(date),
          note: note.trim() || undefined,
        };
        if (editIncome) {
          await updateIncome({ id: editIncome.id, body: payload }).unwrap();
          dispatch(addToast('Gelir güncellendi'));
        } else {
          await createIncome(payload).unwrap();
          dispatch(addToast('Gelir eklendi'));
        }
      }
      close();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, 'Kaydedilemedi'), 'error'));
    }
  };

  const onDelete = () => {
    const label = editIncome?.title ?? editTpl?.title ?? '';
    Alert.alert('Sil', `"${label}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            if (editTpl) await deleteTpl(editTpl.id).unwrap();
            else if (editIncome) await deleteIncome(editIncome.id).unwrap();
            dispatch(addToast('Silindi'));
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

  const busy = c1 || u1 || d1 || c2 || u2 || d2;
  const heading = isEditing ? (repeat ? 'Düzenli geliri düzenle' : 'Geliri düzenle') : 'Yeni gelir';

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['85%']}
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
          <Text variant="h2">{heading}</Text>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kapat" className="p-1 active:opacity-60">
            <Icon icon={X} size={22} color={colors.muted} />
          </Pressable>
        </View>

        <Field label="Başlık">
          <Input bottomSheet value={title} onChangeText={setTitle} maxLength={LIMITS.title} placeholder={repeat ? 'Örn. Maaş' : 'Örn. Ek iş ödemesi'} />
        </Field>

        <Field label="Tutar">
          <CurrencyInput value={amount} onChangeValue={setAmount} />
        </Field>

        {/* Tekrarla toggle — yalnızca yeni eklerken; düzenlerken tip sabit */}
        {!isEditing ? (
          <View className="flex-row items-center justify-between rounded-xl bg-surface px-3 py-2.5">
            <View className="flex-1 pr-3">
              <Text variant="label">Tekrarla</Text>
              <Text variant="muted">Her ay otomatik gelir olarak eklenir</Text>
            </View>
            <Switch value={repeat} onValueChange={setRepeat} />
          </View>
        ) : null}

        {repeat ? (
          <>
            <Field label="Ayın günü">
              <View className="flex-row flex-wrap gap-2">
                {DAYS.map((d) => {
                  const sel = dayOfMonth === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDayOfMonth(d)}
                      className={cn(
                        'h-9 w-9 items-center justify-center rounded-full border active:opacity-70',
                        sel ? 'border-accent bg-accent' : 'border-border bg-white',
                      )}
                    >
                      <Text className={cn('text-sm', sel ? 'text-white' : 'text-foreground')}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="Başlangıç">
              <Pressable
                onPress={() => setPicker('start')}
                className="rounded-xl border border-border bg-white px-3 py-3 active:opacity-70"
              >
                <Text variant="body" className="capitalize">{formatDate(toISODate(startDate))}</Text>
              </Pressable>
            </Field>

            <Field label="Bitiş (opsiyonel)">
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setPicker('end')}
                  className="flex-1 rounded-xl border border-border bg-white px-3 py-3 active:opacity-70"
                >
                  <Text variant={endDate ? 'body' : 'muted'} className="capitalize">
                    {endDate ? formatDate(toISODate(endDate)) : 'Bitiş yok'}
                  </Text>
                </Pressable>
                {endDate ? (
                  <Pressable onPress={() => setEndDate(null)} hitSlop={6} className="p-1 active:opacity-60">
                    <Icon icon={X} size={20} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
            </Field>
          </>
        ) : (
          <Field label="Tarih">
            <Pressable
              onPress={() => setPicker('date')}
              className="rounded-xl border border-border bg-white px-3 py-3 active:opacity-70"
            >
              <Text variant="body" className="capitalize">{formatDate(toISODate(date))}</Text>
            </Pressable>
          </Field>
        )}

        <DatePicker
          visible={picker !== null}
          value={picker === 'date' ? date : picker === 'end' ? (endDate ?? startDate) : startDate}
          onConfirm={(d) =>
            picker === 'date' ? setDate(d) : picker === 'end' ? setEndDate(d) : setStartDate(d)
          }
          onClose={() => setPicker(null)}
        />

        <Field label="Not (opsiyonel)">
          <Input bottomSheet value={note} onChangeText={setNote} maxLength={LIMITS.note} placeholder="Açıklama" />
        </Field>

        {editTpl ? (
          <View className="flex-row items-center justify-between rounded-xl bg-surface px-3 py-2.5">
            <Text variant="label">Aktif</Text>
            <Switch value={active} onValueChange={setActive} />
          </View>
        ) : null}

        <Button label={isEditing ? 'Güncelle' : 'Kaydet'} onPress={onSave} loading={busy} />
        {isEditing ? (
          <Button label="Sil" variant="danger" leftIcon={Trash2} onPress={onDelete} disabled={busy} />
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

IncomeFormSheet.displayName = 'IncomeFormSheet';
