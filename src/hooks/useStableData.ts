import { useRef } from 'react';

/**
 * RTK Query'de arg değiştiğinde (ay/yıl) yeni cache anahtarı için `data` anlık olarak
 * `undefined` olur; bu da listenin iskelete çöküp tasarımın "zıplamasına" yol açar.
 *
 * Bu hook son dolu veriyi saklar ve yeni veri gelene kadar öncekini döndürür
 * (React Query'nin `keepPreviousData` davranışı gibi). Böylece dönem/sekme değişiminde
 * layout sabit kalır; iskelet yalnızca uygulama ömründe HİÇ veri gelmediğinde
 * (gerçek ilk yükleme) gösterilir — o da `undefined` dönüşüyle ayırt edilir.
 */
export function useStableData<T>(data: T | undefined): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  if (data !== undefined) ref.current = data;
  return ref.current;
}
