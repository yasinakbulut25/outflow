import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  defaultCurrencyFor,
  detectLanguage,
  type Currency,
  type Language,
} from '@/i18n/locale';

interface SettingsState {
  language: Language;
  currency: Currency;
}

// İlk kurulumda cihaz diline göre seçilir (TR → Türkçe + ₺, diğer → İngilizce + €).
// Sonraki açılışlarda redux-persist ile saklanan değer bunun üzerine yazar.
const initialLanguage = detectLanguage();
const initialState: SettingsState = {
  language: initialLanguage,
  currency: defaultCurrencyFor(initialLanguage),
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    setCurrency: (state, action: PayloadAction<Currency>) => {
      state.currency = action.payload;
    },
  },
});

export const { setLanguage, setCurrency } = settingsSlice.actions;
export default settingsSlice.reducer;
