import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";

import { radius, spacing } from "@/theme";
import { useAccessibleTheme } from "./useAccessibleTheme";

type TextFieldProps = {
  label: string;
  placeholder?: string;
  value?: string;
  multiline?: boolean;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  helperText?: string;
  onChangeText?: (value: string) => void;
};

export function TextField({
  label,
  placeholder,
  value,
  multiline = false,
  editable = true,
  keyboardType = "default",
  helperText,
  onChangeText,
}: TextFieldProps) {
  const theme = useAccessibleTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted }, theme.typography.caption]}>{label}</Text>
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
          theme.typography.body,
          !editable ? styles.inputDisabled : null,
          multiline ? styles.multiline : null,
        ]}
        value={value}
      />
      {helperText ? (
        <Text style={[styles.helperText, { color: theme.colors.textMuted }, theme.typography.caption]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    textTransform: "uppercase",
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  multiline: {
    minHeight: 108,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: -2,
  },
});
