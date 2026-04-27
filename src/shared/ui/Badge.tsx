import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type BadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone]]}>
      <Text style={[styles.text, textStyles[tone]]}>{label}</Text>
    </View>
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
    ...typography.caption,
  },
  neutral: {
    backgroundColor: colors.surfaceSoft,
  },
  success: {
    backgroundColor: "rgba(125, 226, 166, 0.16)",
  },
  warning: {
    backgroundColor: "rgba(255, 210, 122, 0.16)",
  },
  danger: {
    backgroundColor: "rgba(255, 140, 140, 0.16)",
  },
  textNeutral: {
    color: colors.text,
  },
  textSuccess: {
    color: colors.success,
  },
  textWarning: {
    color: colors.warning,
  },
  textDanger: {
    color: colors.danger,
  },
});

const toneStyles = StyleSheet.create({
  neutral: styles.neutral,
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
});

const textStyles = StyleSheet.create({
  neutral: styles.textNeutral,
  success: styles.textSuccess,
  warning: styles.textWarning,
  danger: styles.textDanger,
});
