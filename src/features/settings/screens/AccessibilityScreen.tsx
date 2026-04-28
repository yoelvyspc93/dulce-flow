import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { saveAccessibilitySettingsAsync } from "@/features/settings/services/settings.service";
import { Screen } from "@/shared/ui";
import { useAccessibleTheme } from "@/shared/ui/useAccessibleTheme";
import type { AccessibilitySettings } from "@/shared/types";
import { defaultAccessibilitySettings, useAppStore } from "@/store/app.store";
import { colors, radius, spacing } from "@/theme";

type FontScaleOption = {
  label: string;
  description: string;
  value: number;
};

const FONT_SCALE_OPTIONS: FontScaleOption[] = [
  {
    label: "Normal",
    description: "Tamano recomendado para uso diario.",
    value: defaultAccessibilitySettings.fontScale,
  },
  {
    label: "Grande",
    description: "Aumenta textos y controles principales.",
    value: 1.2,
  },
  {
    label: "Extra grande",
    description: "Maxima legibilidad disponible en la app.",
    value: 1.35,
  },
];

function isSelectedScale(current: number, option: number): boolean {
  return Math.abs(current - option) < 0.01;
}

export function AccessibilityScreen() {
  const theme = useAccessibleTheme();
  const accessibilitySettings = useAppStore((state) => state.accessibilitySettings);
  const updateAccessibilitySettings = useAppStore((state) => state.updateAccessibilitySettings);
  const [isSaving, setIsSaving] = useState(false);

  async function updateAccessibilityAsync(patch: Partial<AccessibilitySettings>) {
    setIsSaving(true);

    try {
      const nextSettings = await saveAccessibilitySettingsAsync({
        ...accessibilitySettings,
        ...patch,
      });
      updateAccessibilitySettings(nextSettings);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen title="Accesibilidad" backHref="/(tabs)/settings">
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }, theme.typography.section]}>Legibilidad</Text>
        <View style={[styles.group, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {FONT_SCALE_OPTIONS.map((option, index) => {
            const selected = isSelectedScale(accessibilitySettings.fontScale, option.value);

            return (
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                key={option.value}
                onPress={() => updateAccessibilityAsync({ fontScale: option.value })}
                style={({ pressed }) => [
                  styles.option,
                  index < FONT_SCALE_OPTIONS.length - 1 ? { borderBottomColor: theme.colors.border, borderBottomWidth: 1 } : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }, theme.typography.bodyStrong]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textMuted }, theme.typography.caption]}>
                    {option.description}
                  </Text>
                </View>
                {selected ? <Check color={theme.colors.accent} size={22} strokeWidth={2.6} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }, theme.typography.section]}>Contraste</Text>
        <View style={[styles.group, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: accessibilitySettings.highContrastEnabled }}
            disabled={isSaving}
            onPress={() => updateAccessibilityAsync({ highContrastEnabled: !accessibilitySettings.highContrastEnabled })}
            style={({ pressed }) => [styles.option, pressed ? styles.pressed : null]}
          >
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }, theme.typography.bodyStrong]}>
                Alto contraste
              </Text>
              <Text style={[styles.optionDescription, { color: theme.colors.textMuted }, theme.typography.caption]}>
                Refuerza bordes, textos y colores para baja vision.
              </Text>
            </View>
            <View
              style={[
                styles.switchTrack,
                {
                  backgroundColor: accessibilitySettings.highContrastEnabled
                    ? theme.colors.accent
                    : theme.colors.surfaceSoft,
                },
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  {
                    backgroundColor: accessibilitySettings.highContrastEnabled
                      ? colors.background
                      : theme.colors.textMuted,
                    transform: [{ translateX: accessibilitySettings.highContrastEnabled ? 18 : 0 }],
                  },
                ]}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    textTransform: "uppercase",
  },
  group: {
    overflow: "hidden",
    borderRadius: radius.md,
    borderWidth: 1,
  },
  option: {
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  optionText: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    flexShrink: 1,
  },
  optionDescription: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.86,
  },
  switchTrack: {
    width: 46,
    height: 28,
    borderRadius: radius.pill,
    padding: 3,
    justifyContent: "center",
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
  },
});
