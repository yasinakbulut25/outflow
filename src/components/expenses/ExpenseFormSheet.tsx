import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { getErrorMessage } from "@/lib/apiError";
import { categoryIcon } from "@/lib/categoryIcons";
import { cn } from "@/lib/cn";
import { LIMITS } from "@/lib/limits";
import {
  calculateInstallmentAmount,
  formatCurrency,
  formatDate,
} from "@/lib/formatters";
import {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetCategoriesQuery,
  useUpdateExpenseMutation,
} from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { addToast } from "@/store/slices/uiSlice";
import { colors } from "@/theme/tokens";
import type { CreateExpensePayload, Expense } from "@/types";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { nanoid } from "@reduxjs/toolkit";
import { Plus, Trash2, X } from "lucide-react-native";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Pressable, View } from "react-native";

export interface ExpenseFormSheetRef {
  present: (expense?: Expense) => void;
}

interface ExpenseFormSheetProps {
  /** Verilirse kategori bu id'ye sabitlenir ve kategori seçimi gizlenir (örn. birikim = 13). */
  forcedCategoryId?: number;
  labels?: { create: string; edit: string };
}

interface ItemRow {
  key: string;
  name: string;
  amount: number;
}

// Çarpışma-proof anahtar: modül sayacı Fast Refresh'te sıfırlanıp çakışabiliyordu.
const newRow = (name = "", amount = 0): ItemRow => ({
  key: nanoid(),
  name,
  amount,
});

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const ExpenseFormSheet = forwardRef<
  ExpenseFormSheetRef,
  ExpenseFormSheetProps
>((props, ref) => {
  const {
    forcedCategoryId,
    labels = { create: "Yeni harcama", edit: "Harcamayı düzenle" },
  } = props;
  const sheetRef = useRef<BottomSheetModal>(null);
  const dispatch = useAppDispatch();
  const { data: categories } = useGetCategoriesQuery();
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: deleting }] = useDeleteExpenseMutation();

  const [editing, setEditing] = useState<Expense | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [paymentType, setPaymentType] = useState<"cash" | "installment">(
    "cash",
  );
  const [installmentCount, setInstallmentCount] = useState(2);
  const [items, setItems] = useState<ItemRow[]>(() => [newRow()]);

  const reset = useCallback(
    (expense?: Expense) => {
      if (expense) {
        setEditing(expense);
        setTitle(expense.title);
        setDate(new Date(expense.expense_date.slice(0, 10) + "T00:00:00"));
        setCategoryId(expense.category_id);
        setPaymentType(expense.payment_type);
        setInstallmentCount(
          expense.installment_count && expense.installment_count >= 2
            ? expense.installment_count
            : 2,
        );
        setItems(
          expense.items.length
            ? expense.items.map((it) => newRow(it.name, it.amount))
            : [newRow()],
        );
      } else {
        setEditing(null);
        setTitle("");
        setDate(new Date());
        setCategoryId(forcedCategoryId);
        setPaymentType("cash");
        setInstallmentCount(2);
        setItems([newRow()]);
      }
    },
    [forcedCategoryId],
  );

  useImperativeHandle(
    ref,
    () => ({
      present: (expense?: Expense) => {
        reset(expense);
        sheetRef.current?.present();
      },
    }),
    [reset],
  );

  const total = useMemo(
    () => items.reduce((sum, it) => sum + (it.amount || 0), 0),
    [items],
  );
  const monthly =
    paymentType === "installment" && installmentCount >= 2
      ? calculateInstallmentAmount(total, installmentCount)
      : null;

  const updateItem = (key: string, patch: Partial<ItemRow>) =>
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    );
  const addItem = () => {
    if (items.length >= LIMITS.maxItems) {
      dispatch(addToast(`En fazla ${LIMITS.maxItems} kalem ekleyebilirsin`, "warning"));
      return;
    }
    const row = newRow();
    setItems((prev) => [...prev, row]);
  };
  const removeItem = (key: string) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.key !== key) : prev,
    );

  const close = () => sheetRef.current?.dismiss();

  const onSave = async () => {
    const cleanItems = items
      .map((it) => ({ name: it.name.trim() || "Kalem", amount: it.amount }))
      .filter((it) => it.amount > 0);

    if (!title.trim()) return dispatch(addToast("Başlık gerekli", "warning"));
    if (!cleanItems.length)
      return dispatch(addToast("En az bir tutar gir", "warning"));
    if (paymentType === "installment" && installmentCount < 2)
      return dispatch(addToast("Taksit sayısı en az 2 olmalı", "warning"));

    const payload: CreateExpensePayload = {
      title: title.trim(),
      expense_date: toISODate(date),
      payment_type: paymentType,
      installment_count:
        paymentType === "installment" ? installmentCount : undefined,
      category_id: categoryId,
      items: cleanItems,
    };

    try {
      if (editing) {
        await updateExpense({ id: editing.id, body: payload }).unwrap();
        dispatch(addToast("Harcama güncellendi"));
      } else {
        await createExpense(payload).unwrap();
        dispatch(addToast("Harcama eklendi"));
      }
      close();
    } catch (err) {
      dispatch(addToast(getErrorMessage(err, "Kaydedilemedi"), "error"));
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert("Harcamayı sil", `"${editing.title}" silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteExpense(editing.id).unwrap();
            dispatch(addToast("Harcama silindi"));
            close();
          } catch (err) {
            dispatch(addToast(getErrorMessage(err, "Silinemedi"), "error"));
          }
        },
      },
    ]);
  };

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  const busy = creating || updating || deleting;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["85%"]}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView
        contentContainerClassName="gap-4 px-4 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between">
          <Text variant="h2">{editing ? labels.edit : labels.create}</Text>
          <Pressable
            onPress={close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            className="p-1 active:opacity-60"
          >
            <Icon icon={X} size={22} color={colors.muted} />
          </Pressable>
        </View>

        <Field label="Başlık">
          <Input
            bottomSheet
            value={title}
            onChangeText={setTitle}
            maxLength={LIMITS.title}
            placeholder="Örn. Market alışverişi"
          />
        </Field>

        <Field label="Tarih">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="rounded-xl border border-border bg-white px-3 py-3 active:opacity-70"
          >
            <Text variant="body" className="capitalize">
              {formatDate(toISODate(date))}
            </Text>
          </Pressable>
        </Field>
        <DatePicker
          visible={showDatePicker}
          value={date}
          onConfirm={setDate}
          onClose={() => setShowDatePicker(false)}
        />

        {forcedCategoryId === undefined ? (
          <Field label="Kategori">
            <View className="flex-row flex-wrap gap-2">
              {(categories ?? []).map((cat) => {
                const { Icon: CatIcon, color } = categoryIcon(cat.id);
                const active = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(active ? undefined : cat.id)}
                    style={
                      active
                        ? { backgroundColor: color, borderColor: color }
                        : undefined
                    }
                    className={cn(
                      "flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-70",
                      active ? "" : "border-border bg-white",
                    )}
                  >
                    <Icon
                      icon={CatIcon}
                      size={15}
                      color={active ? colors.white : color}
                    />
                    <Text
                      className={cn(
                        "text-sm",
                        active ? "font-semibold text-white" : "text-foreground",
                      )}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        ) : null}

        <Field label="Ödeme tipi">
          <View className="flex-row rounded-xl border border-border bg-surface p-1">
            {(["cash", "installment"] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setPaymentType(type)}
                className={cn(
                  "flex-1 items-center rounded-xl py-2 active:opacity-70",
                  paymentType === type && "bg-accent",
                )}
              >
                <Text
                  className={cn(
                    "font-medium",
                    paymentType === type ? "text-white" : "text-muted",
                  )}
                >
                  {type === "cash" ? "Peşin" : "Taksit"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>

        {paymentType === "installment" ? (
          <Field label="Taksit sayısı">
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setInstallmentCount((c) => Math.max(2, c - 1))}
                className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-white active:opacity-70"
              >
                <Text variant="h2">−</Text>
              </Pressable>
              <Text variant="mono" className="w-10 text-center text-lg">
                {installmentCount}
              </Text>
              <Pressable
                onPress={() => setInstallmentCount((c) => Math.min(36, c + 1))}
                className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-white active:opacity-70"
              >
                <Text variant="h2">+</Text>
              </Pressable>
            </View>
          </Field>
        ) : null}

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text variant="label">Kalemler</Text>
            <Pressable
              onPress={addItem}
              className="flex-row items-center gap-1 active:opacity-60"
            >
              <Icon icon={Plus} size={16} color={colors.accent} />
              <Text className="text-sm font-medium text-accent">Ekle</Text>
            </Pressable>
          </View>
          {items.map((it) => (
            <View key={it.key} className="flex-row items-center gap-2">
              <Input
                bottomSheet
                value={it.name}
                onChangeText={(t) => updateItem(it.key, { name: t })}
                maxLength={LIMITS.itemName}
                placeholder="Kalem adı"
                className="flex-1"
              />
              <CurrencyInput
                value={it.amount}
                onChangeValue={(v) => updateItem(it.key, { amount: v })}
                className="w-28"
              />
              <Pressable
                onPress={() => removeItem(it.key)}
                disabled={items.length === 1}
                hitSlop={6}
                className={cn("p-1", items.length === 1 && "opacity-30")}
              >
                <Icon icon={Trash2} size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </View>

        <View className="gap-1 rounded-xl bg-surface p-3">
          <View className="flex-row items-center justify-between">
            <Text variant="label">Toplam</Text>
            <Text variant="mono" className="text-lg">
              {formatCurrency(total)} ₺
            </Text>
          </View>
          {monthly !== null ? (
            <View className="flex-row items-center justify-between">
              <Text variant="muted">Aylık taksit ({installmentCount}x)</Text>
              <Text variant="muted">{formatCurrency(monthly)} ₺</Text>
            </View>
          ) : null}
        </View>

        <Button
          label={editing ? "Güncelle" : "Kaydet"}
          onPress={onSave}
          loading={busy}
        />
        {editing ? (
          <Button
            label="Sil"
            variant="danger"
            leftIcon={Trash2}
            onPress={onDelete}
            disabled={busy}
          />
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

ExpenseFormSheet.displayName = "ExpenseFormSheet";
