import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type SelectFieldProps = {
  label: string;
  value: string;
};

export function SelectField({ label, value }: SelectFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.control}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.chevron}>+</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    ...typography.caption,
  },
  control: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    color: colors.text,
    ...typography.body,
  },
  chevron: {
    color: colors.accent,
    ...typography.bodyStrong,
  },
});
