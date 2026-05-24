import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

// Geçici ekran iskeleti — ilgili faz tamamlanınca gerçek içerikle değişir.
export function Placeholder({ title }: { title: string }) {
  return (
    <Screen>
      <Text variant="h1">{title}</Text>
      <Text variant="muted" className="mt-2">Bu ekran yakında geliyor.</Text>
    </Screen>
  );
}
