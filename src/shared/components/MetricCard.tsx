import { StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "@/theme";
import { AmountText, SurfaceCard } from "@/shared/ui";

type MetricCardProps = {
  label: string;
  amount: string;
  tone?: "default" | "success" | "danger";
};

export function MetricCard({ label, amount, tone = "default" }: MetricCardProps) {
  return (
    <SurfaceCard>
      <Text style={styles.label}>{label}</Text>
      <AmountText amount={amount} tone={tone} />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    ...typography.caption,
    marginBottom: spacing.xs,
  },
});
