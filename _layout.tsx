import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      {/* ===== VISIBLE TABS ===== */}

      {/* Início - For all users */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Dashboard - Admin only */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: "Dashboard",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      {/* Mensalidades - Admin only */}
      <Tabs.Screen
        name="admin-fees"
        options={{
          title: "Mensalidades",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="creditcard.fill" color={color} />
          ),
        }}
      />

      {/* Comunicados - Admin only */}
      <Tabs.Screen
        name="admin-communications"
        options={{
          title: "Comunicados",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />

      {/* Notificações - Admin only */}
      <Tabs.Screen
        name="notification-center"
        options={{
          title: "Notificações",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          ),
        }}
      />

      {/* Configurações - Admin only */}
      <Tabs.Screen
        name="admin-settings"
        options={{
          title: "Config",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gear" color={color} />
          ),
        }}
      />

      {/* ===== HIDDEN SCREENS (not shown in tab bar) ===== */}
      <Tabs.Screen name="admin-conversations" options={{ href: null }} />
      <Tabs.Screen name="admin-conversations-ai-suggestions" options={{ href: null }} />
      <Tabs.Screen name="admin-conversations-with-quick-replies" options={{ href: null }} />
      <Tabs.Screen name="admin-expenses" options={{ href: null }} />
      <Tabs.Screen name="admin-payment-resend" options={{ href: null }} />
      <Tabs.Screen name="admin-reports" options={{ href: null }} />
      <Tabs.Screen name="admin-whatsapp" options={{ href: null }} />
      <Tabs.Screen name="admin-whatsapp-connect" options={{ href: null }} />
      <Tabs.Screen name="admin-whatsapp-qrcode" options={{ href: null }} />
      <Tabs.Screen name="admin-whatsapp-simple" options={{ href: null }} />
      <Tabs.Screen name="batch-billing" options={{ href: null }} />
      <Tabs.Screen name="chamados" options={{ href: null }} />
      <Tabs.Screen name="cobracas" options={{ href: null }} />
      <Tabs.Screen name="cobrancas" options={{ href: null }} />
      <Tabs.Screen name="conciliacao" options={{ href: null }} />
      <Tabs.Screen name="despesas" options={{ href: null }} />
      <Tabs.Screen name="exportar-inadimplentes" options={{ href: null }} />
      <Tabs.Screen name="flows-history" options={{ href: null }} />
      <Tabs.Screen name="flows-retry-schedules" options={{ href: null }} />
      <Tabs.Screen name="moradores" options={{ href: null }} />
      <Tabs.Screen name="notificacoes" options={{ href: null }} />
      <Tabs.Screen name="relatorios" options={{ href: null }} />
      <Tabs.Screen name="relatorios-financeiros" options={{ href: null }} />
      <Tabs.Screen name="webhook-dashboard" options={{ href: null }} />
      <Tabs.Screen name="webhook-history" options={{ href: null }} />
      <Tabs.Screen name="whatsapp-flows" options={{ href: null }} />
    </Tabs>
  );
}
