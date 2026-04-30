import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { saveBusinessSettingsAsync } from "@/features/settings/services/settings.service";
import { SectionHeader } from "@/shared/components";
import { AVATAR_OPTIONS, AvatarButton, Button, Screen, TextField } from "@/shared/ui";
import { useAppStore } from "@/store/app.store";
import { colors, radius, spacing, typography } from "@/theme";

export function OnboardingScreen() {
  const existingSettings = useAppStore((state) => state.businessSettings);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const updateBusinessSettings = useAppStore((state) => state.updateBusinessSettings);
  const [businessName, setBusinessName] = useState(existingSettings?.businessName ?? "");
  const [avatarId, setAvatarId] = useState(existingSettings?.avatarId ?? AVATAR_OPTIONS[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        currency: "CUP",
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
        subtitle="Tus datos se guardan en este dispositivo. Puedes cambiar nombre y avatar despues desde Ajustes > Configuracion inicial."
      />
      <TextField
        label="Nombre del negocio"
        onChangeText={setBusinessName}
        placeholder="Dulces Maria"
        value={businessName}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={{ gap: 12, marginTop: 8 }}>
        <Button disabled={isSaving} label={isSaving ? "Guardando..." : "Guardar y continuar"} onPress={handleSaveAsync} />
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
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  errorText: {
    color: colors.danger,
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
