import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type TextFieldProps = {
  label: string;
  placeholder?: string;
  value?: string;
  multiline?: boolean;
};

export function TextField({ label, placeholder, value, multiline = false }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={false}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline ? styles.multiline : null]}
        value={value}
      />
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
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  multiline: {
    minHeight: 108,
    textAlignVertical: "top",
  },
});
