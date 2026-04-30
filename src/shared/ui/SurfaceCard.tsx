import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

type SurfaceCardProps = PropsWithChildren<{
  tone?: "default" | "accent" | "success" | "danger";
}>;

export function SurfaceCard({ children, tone = "default" }: SurfaceCardProps) {
  return <View style={[styles.card, toneStyles[tone]]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 3,
  },
  defaultTone: {
    backgroundColor: colors.surface,
  },
  accentTone: {
    backgroundColor: colors.surface,
    borderColor: "rgba(127, 219, 255, 0.3)",
  },
  successTone: {
    backgroundColor: colors.surface,
    borderColor: "rgba(125, 226, 166, 0.28)",
  },
  dangerTone: {
    backgroundColor: colors.surface,
    borderColor: "rgba(255, 140, 140, 0.28)",
  },
});

const toneStyles = StyleSheet.create({
  default: styles.defaultTone,
  accent: styles.accentTone,
  success: styles.successTone,
  danger: styles.dangerTone,
});
