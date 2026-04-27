import { Tabs } from "expo-router";

import { colors, radius, spacing, typography } from "@/theme";

export default function TabsLayout() {
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
      <Tabs.Screen name="home" options={{ title: "Inicio" }} />
      <Tabs.Screen name="orders" options={{ title: "Ordenes" }} />
      <Tabs.Screen name="expenses" options={{ title: "Gastos" }} />
      <Tabs.Screen name="settings" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}
