import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AuthData, User } from '@/types';
import { getToken, setToken, getStoredUser, setStoredUser, clearSession } from '@/lib/secureToken';
import { api } from '@/store/api';
import { MOCK_TOKEN, enableMockSession, disableMockSession } from '@/lib/mockBackend';

interface AuthState {
  user: User | null;
  hydrated: boolean; // başlangıç token okuması tamamlandı mı
}

const initialState: AuthState = { user: null, hydrated: false };

/** Uygulama açılışında: saklı token + kullanıcı varsa oturumu kur. */
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const token = await getToken();
  if (!token) return null;
  // Saklı token mock token ise → demo oturumu yeniden aç (uygulama yeniden açılışında).
  if (token === MOCK_TOKEN) enableMockSession();
  return await getStoredUser();
});

/** Login/register başarısında: token + kullanıcıyı sakla. */
export const signIn = createAsyncThunk('auth/signIn', async (auth: AuthData) => {
  await setToken(auth.token);
  await setStoredUser(auth.user);
  return auth.user;
});

/** Çıkış: oturumu temizle + RTK Query cache'ini sıfırla. */
export const signOut = createAsyncThunk('auth/signOut', async (_, { dispatch }) => {
  await clearSession();
  disableMockSession(); // demo oturumundan çıkışta gerçek backend'e geri dön
  dispatch(api.util.resetApiState());
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 401 auto-logout: api.ts tarafından dispatch edilir (circular import olmadan).
    logout: (state) => { state.user = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.hydrated = true;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.hydrated = true;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default authSlice.reducer;
