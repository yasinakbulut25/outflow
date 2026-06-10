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
import { categoryIcon } from '@/lib/categoryIcons';
import { formatDate } from '@/lib/formatters';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { getErrorMessage } from '@/lib/apiError';
import {
  useGetCategoriesQuery,
  useCreateRecurringMutation,
  useUpdateRecurringMutation,
  useDeleteRecurringMutation,
} from '@/store/api';
import type { RecurringTemplate, CreateRecurringPayload } from '@/types';

export interface RecurringFormSheetRef {
  present: (template?: RecurringTemplate) => void;
}

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type PickerTarget = 'start' | 'end' | null;

export const RecurringFormSheet = forwardRef<RecurringFormSheetRef>((_props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const dispatch = useAppDispatch();
  const { data: categories } = useGetCategoriesQuery();
  const [createRecurring, { isLoading: creating }] = useCreateRecurringMutation();
  const [updateRecurring, { isLoading: updating }] = useUpdateRecurringMutation();
  const [deleteRecurring, { isLoading: deleting }] = useDeleteRecurringMutation();

  const [editing, setEditing] = useState<RecurringTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [active, setActive] = useState(true);
  const [picker, setPicker] = useState<PickerTarget>(null);

  const reset = useCallback((tpl?: RecurringTemplate) => {
    if (tpl) {
      setEditing(tpl);
      setTitle(tpl.title);
      setAmount(tpl.amount);
      setDayOfMonth(tpl.day_of_month);
      setStartDate(new Date(tpl.start_date.slice(0, 10) + 'T00:00:00'));
      setEndDate(tpl.end_date ? new Date(tpl.end_date.slice(0, 10) + 'T00:00:00') : null);
      setCategoryId(tpl.category_id);
      setActive(tpl.active);
    } else {
      setEditing(null);
      setTitle('');
      setAmount(0);
      setDayOfMonth(1);
      setStartDate(new Date());
      setEndDate(null);
      setCategoryId(undefined);
      setActive(true);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    present: (tpl?: RecurringTemplate) => {
      reset(tpl);
      sheetRef.current?.present();
    },
  }), [reset]);

  const close = () => sheetRef.current?.dismiss();

  const onSave = async () => {
    if (!title.trim()) return dispatch(addToast('Başlık gerekli', 'warning'));
    if (amount <= 0) return dispatch(addToast('Tutar gir', 'warning'));

    const payload: CreateRecurringPayload = {
      title: title.trim(),
      amount,
      day_of_month: dayOfMonth,
      start_date: toISODate(startDate),
      end_date: endDate ? toISODate(endDate) : null,
      category_id: categoryId,
    };

    try {
      if (editing) {
        await updateRecurring({ id: editing.id, body: { ...payload, active } }).unwrap();
        dispatch(addToast('Şablon güncellendi'));
      } else {
        await createRecurring(payload).unwrap();
        dispatch(addToast('Şablon eklendi'));
      }
      close();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, 'Kaydedilemedi'), 'error'));
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert('Şablonu sil', `"${editing.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecurring(editing.id).unwrap();
            dispatch(addToast('Şablon silindi'));
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
          <Text variant="h2">{editing ? 'Şablonu düzenle' : 'Yeni düzenli ödeme'}</Text>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kapat" className="p-1 active:opacity-60">
            <Icon icon={X} size={22} color={colors.muted} />
          </Pressable>
        </View>

        <Field label="Başlık">
          <Input bottomSheet value={title} onChangeText={setTitle} placeholder="Örn. Netflix aboneliği" />
        </Field>

        <Field label="Tutar">
          <CurrencyInput value={amount} onChangeValue={setAmount} />
        </Field>

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

        <DatePicker
          visible={picker !== null}
          value={picker === 'end' ? (endDate ?? startDate) : startDate}
          onConfirm={(d) => (picker === 'end' ? setEndDate(d) : setStartDate(d))}
          onClose={() => setPicker(null)}
        />

        <Field label="Kategori">
          <View className="flex-row flex-wrap gap-2">
            {(categories ?? []).map((cat) => {
              const { Icon: CatIcon, color } = categoryIcon(cat.id);
              const sel = categoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(sel ? undefined : cat.id)}
                  style={sel ? { backgroundColor: color, borderColor: color } : undefined}
                  className={cn(
                    'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-70',
                    sel ? '' : 'border-border bg-white',
                  )}
                >
                  <Icon icon={CatIcon} size={15} color={sel ? colors.white : color} />
                  <Text className={cn('text-sm', sel ? 'font-semibold text-white' : 'text-foreground')}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {editing ? (
          <View className="flex-row items-center justify-between rounded-xl bg-surface px-3 py-2.5">
            <Text variant="label">Aktif</Text>
            <Switch value={active} onValueChange={setActive} />
          </View>
        ) : null}

        <Button label={editing ? 'Güncelle' : 'Kaydet'} onPress={onSave} loading={busy} />
        {editing ? (
          <Button label="Sil" variant="danger" leftIcon={Trash2} onPress={onDelete} disabled={busy} />
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

RecurringFormSheet.displayName = 'RecurringFormSheet';
