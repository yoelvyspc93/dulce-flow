import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type SelectFieldProps = {
  label: string;
  value: string;
  onPress?: () => void;
};

export function SelectField({ label, value, onPress }: SelectFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.control, pressed ? styles.pressed : null]}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.chevron}>{onPress ? ">" : "+"}</Text>
      </Pressable>
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
  pressed: {
    opacity: 0.86,
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
