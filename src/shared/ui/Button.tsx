import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { useAccessibleTheme } from "./useAccessibleTheme";

export type ButtonVariant = "solid" | "textAccent" | "textLight" | "outlineAccent" | "outlineLight";

type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  leftSlot?: ReactNode;
  disabled?: boolean;
};

export function Button({ label, variant = "solid", onPress, leftSlot, disabled = false }: ButtonProps) {
  const theme = useAccessibleTheme();
  const isOutline = variant === "outlineAccent" || variant === "outlineLight";
  const solidTextColor = theme.colors.accent === colors.white ? theme.colors.background : colors.white;
  const textColor =
    variant === "solid"
      ? solidTextColor
      : variant === "textLight" || variant === "outlineLight"
      ? theme.colors.text
      : theme.colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : null,
        variant === "solid" ? { backgroundColor: theme.colors.accent } : null,
        variant === "outlineAccent" ? { borderColor: theme.colors.accent } : null,
        variant === "outlineLight" ? { borderColor: theme.colors.text } : null,
        disabled ? styles.disabled : pressed ? styles.pressed : null,
      ]}
    >
      {leftSlot ? <View style={styles.leftSlot}>{leftSlot}</View> : null}
      <Text style={[styles.label, theme.typography.bodyStrong, { color: textColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    flexShrink: 1,
    textAlign: "center",
  },
  leftSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
});
