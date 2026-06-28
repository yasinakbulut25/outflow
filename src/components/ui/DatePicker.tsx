import { useState } from 'react';
import { Modal, View, Pressable, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/tokens';
import { useTranslation } from '@/i18n';

interface DatePickerProps {
  visible: boolean;
  value: Date;
  onConfirm: (d: Date) => void;
  onClose: () => void;
}

// iOS popup — yalnız görünürken mount olur, bu yüzden geçici tarih useState ilk
// değeriyle kurulur (effect'le senkron gerekmez).
function IosDatePicker({ value, onConfirm, onClose }: Omit<DatePickerProps, "visible">) {
  const { t } = useTranslation();
  const [temp, setTemp] = useState(value);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-2xl bg-white px-4 pb-6 pt-2" onPress={() => {}}>
          <View className="mb-1 flex-row items-center justify-between">
            <Pressable onPress={onClose} hitSlop={8} className="p-2 active:opacity-60">
              <Text style={{ color: colors.muted }}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onConfirm(temp);
                onClose();
              }}
              hitSlop={8}
              className="p-2 active:opacity-60"
            >
              <Text className="font-semibold" style={{ color: colors.accent }}>{t("common.ok")}</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={temp}
            mode="date"
            display="spinner"
            // Modal arka planı beyaz; cihaz karanlık modda olsa bile picker'ı açık
            // temaya zorla ve metin rengini koyu ver (yoksa beyaz-üstüne-beyaz olur).
            themeVariant="light"
            textColor={colors.foreground}
            onChange={(_e, d) => {
              if (d) setTemp(d);
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Tarih seçici: Android'de native dialog (popup, otomatik kapanır),
// iOS'ta alttan açılan Modal popup + Tamam/İptal (inline gömülü değil).
export function DatePicker({ visible, value, onConfirm, onClose }: DatePickerProps) {
  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        onChange={(e: DateTimePickerEvent, d?: Date) => {
          onClose();
          if (e.type === 'set' && d) onConfirm(d);
        }}
      />
    );
  }

  return <IosDatePicker value={value} onConfirm={onConfirm} onClose={onClose} />;
}
