import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import { StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { useAccessibleTheme } from "./useAccessibleTheme";

type BadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const badgeGradients: Record<NonNullable<BadgeProps["tone"]>, LinearGradientProps["colors"]> = {
  neutral: ["#BDFBE6", "#7FF4D6"],
  success: ["#B6EB9E", "#73B15D"],
  warning: ["#ECC791", "#FCE49E"],
  danger: ["#EF9A91", "#FE958E"],
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const theme = useAccessibleTheme();
  return (
    <LinearGradient
      colors={badgeGradients[tone]}
      end={{ x: 1, y: 0.5 }}
      start={{ x: 0, y: 0.5 }}
      style={styles.base}
    >
      <Text style={[styles.text, theme.typography.caption]}>{label}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    color: colors.darkGray,
  },
});
