import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedYear, setSelectedMonth } from '@/store/slices/uiSlice';

// Aktif dönem (yıl + opsiyonel ay) durumunu ui slice üzerinden okur/yazar.
// month === null → tüm yıl.
export function usePeriod() {
  const dispatch = useAppDispatch();
  const year = useAppSelector((s) => s.ui.selectedYear);
  const month = useAppSelector((s) => s.ui.selectedMonth);

  return {
    year,
    month,
    setYear: (y: number) => dispatch(setSelectedYear(y)),
    setMonth: (m: number | null) => dispatch(setSelectedMonth(m)),
    prevYear: () => dispatch(setSelectedYear(year - 1)),
    nextYear: () => dispatch(setSelectedYear(year + 1)),
  };
}
