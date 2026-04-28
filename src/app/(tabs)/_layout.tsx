import { Redirect, Tabs } from "expo-router";
import { ClipboardList, House, ReceiptText, Settings } from "lucide-react-native";

import { useAppStore } from "@/store/app.store";
import { colors, radius, spacing, typography } from "@/theme";

export default function TabsLayout() {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 76,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: "700",
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarItemStyle: {
          borderRadius: radius.md,
          marginHorizontal: spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Ordenes",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} strokeWidth={2.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Gastos",
          tabBarIcon: ({ color, size }) => (
            <ReceiptText color={color} size={size} strokeWidth={2.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} strokeWidth={2.4} />,
        }}
      />
    </Tabs>
  );
}
