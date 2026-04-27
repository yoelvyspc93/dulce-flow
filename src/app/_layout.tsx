import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { loadBusinessSettingsAsync } from "@/features/settings/services/settings.service";
import { useAppStore } from "@/store/app.store";
import { colors, spacing, typography } from "@/theme";

export default function RootLayout() {
  const bootstrapStatus = useAppStore((state) => state.bootstrapStatus);
  const setBootstrapLoading = useAppStore((state) => state.setBootstrapLoading);
  const setBootstrapReady = useAppStore((state) => state.setBootstrapReady);
  const setBootstrapError = useAppStore((state) => state.setBootstrapError);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAsync() {
      setBootstrapLoading();

      try {
        const settings = await loadBusinessSettingsAsync();

        if (isMounted) {
          setBootstrapReady(settings);
        }
      } catch {
        if (isMounted) {
          setBootstrapError();
        }
      }
    }

    if (bootstrapStatus === "idle") {
      void bootstrapAsync();
    }

    return () => {
      isMounted = false;
    };
  }, [bootstrapStatus, setBootstrapError, setBootstrapLoading, setBootstrapReady]);

  if (bootstrapStatus === "idle" || bootstrapStatus === "loading") {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Preparando DulceFlow...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    ...typography.body,
  },
});
