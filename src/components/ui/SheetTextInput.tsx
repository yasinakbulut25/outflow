import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { cssInterop } from 'nativewind';

// @gorhom/bottom-sheet'in BottomSheetTextInput'u, odaklanan inputu klavyenin üstünde
// tutmak için sheet'e kayıt olur (düz RN TextInput bunu yapamaz → input klavye altında
// kalır). NativeWind className'inin çalışması için cssInterop ile style'a maplenir.
// NOT: Yalnızca bir BottomSheet içinde kullanılabilir (dışarıda hata verir).
export const SheetTextInput = cssInterop(BottomSheetTextInput, { className: 'style' });
