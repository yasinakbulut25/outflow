import {
  Fuel, ShoppingCart, FileText, Shirt, Laptop, HeartPulse, Clapperboard,
  UtensilsCrossed, Bus, ShoppingBag, BookOpen, Package, HandCoins,
} from 'lucide-react-native';
import type { IconComponent } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';

// Kategori id → Lucide ikon + renk (emoji yerine). Seed sırasıyla eşleşir (SPEC.md §6.2).
export const BIRIKIM_CATEGORY_ID = 13;

export const CATEGORY_ICONS: Record<number, { Icon: IconComponent; color: string }> = {
  1: { Icon: Fuel, color: '#EF4444' },
  2: { Icon: ShoppingCart, color: '#22C55E' },
  3: { Icon: FileText, color: '#3B82F6' },
  4: { Icon: Shirt, color: '#8B5CF6' },
  5: { Icon: Laptop, color: '#F59E0B' },
  6: { Icon: HeartPulse, color: '#EC4899' },
  7: { Icon: Clapperboard, color: '#F97316' },
  8: { Icon: UtensilsCrossed, color: '#84CC16' },
  9: { Icon: Bus, color: '#06B6D4' },
  10: { Icon: ShoppingBag, color: '#A855F7' },
  11: { Icon: BookOpen, color: '#10B981' },
  12: { Icon: Package, color: '#6B7280' },
  13: { Icon: HandCoins, color: '#d97706' },
};

export function categoryIcon(id?: number): { Icon: IconComponent; color: string } {
  if (id && CATEGORY_ICONS[id]) return CATEGORY_ICONS[id];
  return { Icon: Package, color: colors.muted };
}
