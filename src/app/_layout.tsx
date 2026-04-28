import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { loadAppSettingsAsync } from "@/features/settings/services/settings.service";
import { Button } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";
import { colors, spacing, typography } from "@/theme";

export default function RootLayout() {
  const hasStartedBootstrap = useRef(false);
  const [retryKey, setRetryKey] = useState(0);
  const bootstrapStatus = useAppStore((state) => state.bootstrapStatus);
  const setBootstrapLoading = useAppStore((state) => state.setBootstrapLoading);
  const setBootstrapReady = useAppStore((state) => state.setBootstrapReady);
  const setBootstrapError = useAppStore((state) => state.setBootstrapError);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAsync() {
      if (hasStartedBootstrap.current) {
        return;
      }

      hasStartedBootstrap.current = true;
      setBootstrapLoading();

      try {
        const settings = await Promise.race([
          loadAppSettingsAsync(),
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 3000);
          }),
        ]);

        if (isMounted) {
          setBootstrapReady(settings?.businessSettings ?? null, settings?.accessibilitySettings);
        }
      } catch {
        if (isMounted) {
          setBootstrapError();
        }
      }
    }

    void bootstrapAsync();

    return () => {
      isMounted = false;
    };
  }, [retryKey, setBootstrapError, setBootstrapLoading, setBootstrapReady]);

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

  if (bootstrapStatus === "error") {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <Text style={styles.errorTitle}>No se pudo iniciar DulceFlow</Text>
          <Text style={styles.loadingText}>
            Revisa la persistencia local y vuelve a intentar la carga inicial.
          </Text>
          <Button
            label="Reintentar"
            onPress={() => {
              hasStartedBootstrap.current = false;
              setRetryKey((current) => current + 1);
            }}
          />
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
  errorTitle: {
    color: colors.text,
    textAlign: "center",
    ...typography.section,
  },
});
