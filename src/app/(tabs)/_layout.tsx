import { Redirect, Tabs } from 'expo-router';
import { Wallet, TrendingUp, PiggyBank, BarChart3, Repeat } from 'lucide-react-native';
import { useAppSelector } from '@/store/hooks';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  const user = useAppSelector((s) => s.auth.user);
  // Auth gate: oturum yoksa girişe yönlendir.
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Harcamalar', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="gelirler"
        options={{ title: 'Gelirler', tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="birikimler"
        options={{ title: 'Birikimler', tabBarIcon: ({ color, size }) => <PiggyBank color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="analiz"
        options={{ title: 'Analiz', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="recurring"
        options={{ title: 'Düzenli', tabBarIcon: ({ color, size }) => <Repeat color={color} size={size} /> }}
      />
    </Tabs>
  );
}
