import { Redirect, Tabs } from 'expo-router';
import { Wallet, TrendingUp, HandCoins, BarChart3, Repeat } from 'lucide-react-native';
import { useAppSelector } from '@/store/hooks';
import { TopBar } from '@/components/ui/TopBar';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  const user = useAppSelector((s) => s.auth.user);
  // Auth gate: oturum yoksa girişe yönlendir.
  if (!user) return <Redirect href="/(auth)/login" />;

  // Her sekmenin kendi aktif rengi; pasifken hepsi muted gri.
  const TAB_COLORS = {
    expenses: '#3b82f6', // mavi
    income: '#16a34a', // yeşil
    savings: '#d97706', // altın
    analytics: '#f43f5e', // kırmızı
    recurring: '#8b5cf6', // mor
  };

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <TopBar />,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Harcamalar',
          tabBarActiveTintColor: TAB_COLORS.expenses,
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="gelirler"
        options={{
          title: 'Gelirler',
          tabBarActiveTintColor: TAB_COLORS.income,
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="birikimler"
        options={{
          title: 'Birikimler',
          tabBarActiveTintColor: TAB_COLORS.savings,
          tabBarIcon: ({ color, size }) => <HandCoins color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="analiz"
        options={{
          title: 'Analiz',
          tabBarActiveTintColor: TAB_COLORS.analytics,
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="recurring"
        options={{
          title: 'Düzenli',
          tabBarActiveTintColor: TAB_COLORS.recurring,
          tabBarIcon: ({ color, size }) => <Repeat color={color} size={size} />,
        }}
      />
    </Tabs>
    <OnboardingModal />
    </>
  );
}
