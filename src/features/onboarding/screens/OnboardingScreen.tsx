import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { saveBusinessSettingsAsync } from "@/features/settings/services/settings.service";
import { SectionHeader } from "@/shared/components";
import { AVATAR_OPTIONS, AvatarButton, Button, Screen, SelectField, TextField } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";
import { colors, radius, spacing, typography } from "@/theme";

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
  const [avatarId, setAvatarId] = useState(existingSettings?.avatarId ?? AVATAR_OPTIONS[0].id);
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
        avatarId,
      });

      updateBusinessSettings(settings);
      router.replace(hasCompletedOnboarding ? "/(tabs)/settings" : "/(tabs)/home");
    } catch {
      setErrorMessage("No se pudo guardar la configuracion inicial.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen
      title={hasCompletedOnboarding ? "Datos del negocio" : "Primera configuracion"}
      backHref={hasCompletedOnboarding ? "/(tabs)/settings" : undefined}
    >
      <View style={styles.avatarPanel}>
        <SectionHeader
          title="Avatar"
          subtitle="Elige como se vera tu negocio en la barra superior."
        />
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map((avatar) => (
            <AvatarButton
              accessibilityLabel={`Seleccionar avatar ${avatar.id}`}
              key={avatar.id}
              avatarId={avatar.id}
              onPress={() => setAvatarId(avatar.id)}
              selected={avatarId === avatar.id}
              size="lg"
            />
          ))}
        </View>
      </View>

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
        onValueChange={(selectedCurrency) => {
          setCurrencyIndex(Math.max(0, CURRENCIES.findIndex((item) => item === selectedCurrency)));
        }}
        options={CURRENCIES.map((item) => ({ label: item, value: item }))}
        value={currency}
      />
      <Text style={styles.helperText}>Toca el selector para elegir entre USD, CUP y EUR.</Text>
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
  avatarPanel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
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
