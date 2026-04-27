import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type IconButtonProps = {
  label: string;
  onPress?: () => void;
};

export function IconButton({ label, onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.86,
  },
  label: {
    color: colors.text,
    ...typography.bodyStrong,
  },
});
