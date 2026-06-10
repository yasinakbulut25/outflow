import { useCallback, useState } from 'react';

/**
 * RefreshControl'ü YALNIZCA kullanıcı parmağıyla aşağı çektiğinde döndürür.
 *
 * Ekranlar daha önce `refreshing={isFetching}` kullanıyordu; bu yüzden ay/yıl
 * değişimindeki arka plan refetch'i (isFetching=true) RefreshControl spinner'ını
 * tetikliyor ve sayfa kendiliğinden aşağı-yukarı "zıplıyordu". Bu hook spinner'ı
 * yalnızca manuel çekişe bağlar; arg değişimi sessizce arka planda yenilenir.
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  return { refreshing, onRefresh };
}
