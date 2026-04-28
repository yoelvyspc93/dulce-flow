import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";
import { AmountText, SurfaceCard } from "@/shared/ui";

type MetricCardProps = {
  label: string;
  amount: string;
  tone?: "default" | "success" | "danger";
};

export function MetricCard({ label, amount, tone = "default" }: MetricCardProps) {
  const cardTone = tone === "default" ? "accent" : tone;

  return (
    <SurfaceCard tone={cardTone}>
      <View style={styles.header}>
        <View style={[styles.indicator, indicatorStyles[tone]]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <AmountText amount={amount} tone={tone} />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.textMuted,
    ...typography.caption,
    textTransform: "uppercase",
  },
  defaultIndicator: {
    backgroundColor: colors.accent,
  },
  successIndicator: {
    backgroundColor: colors.success,
  },
  dangerIndicator: {
    backgroundColor: colors.danger,
  },
});

const indicatorStyles = StyleSheet.create({
  default: styles.defaultIndicator,
  success: styles.successIndicator,
  danger: styles.dangerIndicator,
});
