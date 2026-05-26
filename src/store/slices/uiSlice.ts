import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'warning' | 'error';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UiState {
  toasts: Toast[];
  selectedYear: number;
  selectedMonth: number | null; // null = tüm yıl
}

const initialState: UiState = {
  toasts: [],
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1, // açılışta cari ay seçili
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.toasts.push(action.payload);
      },
      prepare: (message: string, type: ToastType = 'success') => ({
        payload: { id: nanoid(), message, type },
      }),
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setSelectedYear: (state, action: PayloadAction<number>) => {
      state.selectedYear = action.payload;
    },
    setSelectedMonth: (state, action: PayloadAction<number | null>) => {
      state.selectedMonth = action.payload;
    },
  },
});

export const { addToast, removeToast, setSelectedYear, setSelectedMonth } = uiSlice.actions;
export default uiSlice.reducer;
