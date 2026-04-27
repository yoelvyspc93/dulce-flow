import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { saveBusinessSettingsAsync } from "@/features/settings/services/settings.service";
import { SectionHeader } from "@/shared/components";
import { Button, Screen, SelectField, TextField } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";
import { colors, spacing, typography } from "@/theme";

const CURRENCIES = ["USD", "CUP", "EUR"] as const;

export function OnboardingScreen() {
  const existingSettings = useAppStore((state) => state.businessSettings);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const updateBusinessSettings = useAppStore((state) => state.updateBusinessSettings);
  const [businessName, setBusinessName] = useState(existingSettings?.businessName ?? "");
  const [currencyIndex, setCurrencyIndex] = useState(() => {
    const index = CURRENCIES.findIndex((item) => item === existingSettings?.currency);
    return index >= 0 ? index : 0;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currency = CURRENCIES[currencyIndex];

  async function handleSaveAsync() {
    const trimmedName = businessName.trim();

    if (!trimmedName) {
      setErrorMessage("El nombre del negocio es obligatorio.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const settings = await saveBusinessSettingsAsync({
        businessName: trimmedName,
        currency,
      });

      updateBusinessSettings(settings);
      router.replace("/(tabs)/home");
    } catch {
      setErrorMessage("No se pudo guardar la configuracion inicial.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen
      title={hasCompletedOnboarding ? "Datos del negocio" : "Primera configuracion"}
      subtitle="Paso inicial para preparar el negocio."
      scrollable={false}
    >
      <SectionHeader
        title="Negocio"
        subtitle="Esta configuracion se guarda en SQLite y define el estado inicial de la app."
      />
      <TextField
        label="Nombre del negocio"
        onChangeText={setBusinessName}
        placeholder="Dulces Maria"
        value={businessName}
      />
      <SelectField
        label="Moneda principal"
        onPress={() => setCurrencyIndex((current) => (current + 1) % CURRENCIES.length)}
        value={currency}
      />
      <Text style={styles.helperText}>Toca el selector para alternar entre USD, CUP y EUR.</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={{ gap: 12, marginTop: 8 }}>
        <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar y continuar"} onPress={handleSaveAsync} />
        <Button
          label={hasCompletedOnboarding ? "Volver a ajustes" : "Guardar y crear productos despues"}
          onPress={hasCompletedOnboarding ? () => router.replace("/(tabs)/settings") : handleSaveAsync}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  helperText: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: -4,
  },
  errorText: {
    color: colors.danger,
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
