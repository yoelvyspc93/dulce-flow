import { BlurTargetView, BlurView, type BlurViewProps } from "expo-blur";
import { Redirect, Tabs } from "expo-router";
import { ClipboardList, House, ReceiptText, Settings } from "lucide-react-native";
import { useRef, type RefObject } from "react";
import { Platform, StyleSheet, View, type View as ViewType } from "react-native";

import { useAppStore } from "@/store/app.store";
import { colors, fontFamily, radius, spacing, typography } from "@/theme";

const TAB_BAR_SURFACE_BACKGROUND = `${colors.background}B3`;

type TabBarBackgroundProps = {
  blurTarget: RefObject<ViewType | null>;
};

function TabBarBackground({ blurTarget }: TabBarBackgroundProps) {
  const androidBlurProps: Partial<BlurViewProps> =
    Platform.OS === "android"
      ? {
        blurMethod: "dimezisBlurViewSdk31Plus",
        blurTarget,
      }
      : {};

  return (
    <View style={styles.tabBarBackground}>
      <BlurView
        intensity={20}
        tint="dark"
        {...androidBlurProps}
        style={styles.tabBarBackground}
      />
    </View>
  );
}

export default function TabsLayout() {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const blurTargetRef = useRef<ViewType | null>(null);

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <BlurTargetView ref={blurTargetRef} style={styles.navigatorTarget}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarBackground: () => <TabBarBackground blurTarget={blurTargetRef} />,
          tabBarStyle: {
            backgroundColor: "transparent",
            borderTopWidth: 0,
            borderBottomWidth: 0,
            height: 64,
            paddingTop: spacing.xs,
            paddingBottom: spacing.xs,
          },
          tabBarLabelStyle: {
            fontFamily: fontFamily.medium,
            fontSize: typography.caption.fontSize,
            fontWeight: "500",
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
            title: "Pedidos",
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
            tabBarIcon: ({ color, size }) => (
              <Settings color={color} size={size} strokeWidth={2.4} />
            ),
          }}
        />
      </Tabs>
    </BlurTargetView>
  );
}

const styles = StyleSheet.create({
  navigatorTarget: {
    flex: 1,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TAB_BAR_SURFACE_BACKGROUND,
  },
});
