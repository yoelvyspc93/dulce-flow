import { BlurTargetView, BlurView, type BlurViewProps } from "expo-blur";
import { Redirect, Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ClipboardList, House, ReceiptText, Settings } from "lucide-react-native";
import { useRef, type RefObject } from "react";
import { Platform, StyleSheet, View, type View as ViewType } from "react-native";

import { useAppStore } from "@/store/app.store";
import { colors, fontFamily, radius, spacing, typography } from "@/theme";

const TAB_BAR_SURFACE_BACKGROUND = `${colors.background}B3`;

type TabBarBackgroundProps = {
  blurTarget: RefObject<ViewType | null>;
};

const nativeTabLabelStyle = {
  color: colors.textMuted,
  fontFamily: fontFamily.medium,
  fontSize: typography.caption.fontSize,
  fontWeight: "500" as const,
};

const selectedNativeTabLabelStyle = {
  ...nativeTabLabelStyle,
  color: colors.accent,
};

const selectedNativeTabIconColor = Platform.OS === "android" ? colors.white : colors.accent;

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

function NativeTabsLayout() {
  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={colors.background}
      badgeBackgroundColor={colors.accent}
      blurEffect="systemChromeMaterialDark"
      disableTransparentOnScrollEdge
      iconColor={{
        default: colors.textMuted,
        selected: colors.accent,
      }}
      indicatorColor={colors.accent}
      labelStyle={{
        default: nativeTabLabelStyle,
        selected: selectedNativeTabLabelStyle,
      }}
      labelVisibilityMode="labeled"
      minimizeBehavior="automatic"
      rippleColor={`${colors.accent}24`}
      tintColor={colors.accent}
    >
      <NativeTabs.Trigger
        contentStyle={{ backgroundColor: colors.background }}
        disableAutomaticContentInsets
        disableTransparentOnScrollEdge
        name="home"
      >
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="home"
          selectedColor={selectedNativeTabIconColor}
          sf={{ default: "house", selected: "house.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        contentStyle={{ backgroundColor: colors.background }}
        disableAutomaticContentInsets
        disableTransparentOnScrollEdge
        name="orders"
      >
        <NativeTabs.Trigger.Label>Pedidos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="checklist"
          selectedColor={selectedNativeTabIconColor}
          sf={{ default: "list.clipboard", selected: "list.clipboard.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        contentStyle={{ backgroundColor: colors.background }}
        disableAutomaticContentInsets
        disableTransparentOnScrollEdge
        name="expenses"
      >
        <NativeTabs.Trigger.Label>Gastos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="receipt_long"
          selectedColor={selectedNativeTabIconColor}
          sf={{ default: "receipt", selected: "receipt.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        contentStyle={{ backgroundColor: colors.background }}
        disableAutomaticContentInsets
        disableTransparentOnScrollEdge
        name="settings"
      >
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="settings"
          selectedColor={selectedNativeTabIconColor}
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function WebTabsLayout() {
  const blurTargetRef = useRef<ViewType | null>(null);

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

export default function TabsLayout() {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (Platform.OS === "web") {
    return <WebTabsLayout />;
  }

  return <NativeTabsLayout />;
}

const styles = StyleSheet.create({
  navigatorTarget: {
    flex: 1,
  },
  tabBarBackground: {
    backgroundColor: TAB_BAR_SURFACE_BACKGROUND,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
