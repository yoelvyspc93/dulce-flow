import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";

import { colors, radius, spacing } from "@/theme";
import { useAccessibleTheme } from "./useAccessibleTheme";

export type SelectFieldOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectFieldOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  helperText?: string;
};

export function SelectField({ label, value, options, onValueChange, disabled = false, helperText }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useAccessibleTheme();
  const selectedOption = options.find((option) => option.value === value);
  const isDisabled = disabled || options.length === 0;

  function handleSelect(option: SelectFieldOption) {
    if (option.disabled) {
      return;
    }

    onValueChange(option.value);
    setIsOpen(false);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted }, theme.typography.caption]}>{label}</Text>
      <Pressable
        disabled={isDisabled}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.control,
          { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
          isDisabled ? styles.disabled : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.value,
            { color: isDisabled ? theme.colors.textMuted : theme.colors.text },
            theme.typography.body,
          ]}
        >
          {selectedOption?.label ?? value}
        </Text>
        <ChevronDown
          color={isDisabled ? theme.colors.textMuted : theme.colors.accent}
          size={18}
          strokeWidth={2.4}
        />
      </Pressable>
      {helperText ? (
        <Text style={[styles.helperText, { color: theme.colors.textMuted }, theme.typography.caption]}>{helperText}</Text>
      ) : null}
      <Modal animationType="fade" onRequestClose={() => setIsOpen(false)} transparent visible={isOpen}>
        <Pressable onPress={() => setIsOpen(false)} style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <Pressable style={[styles.menu, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
            <FlatList
              data={options}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;

                return (
                  <Pressable
                    disabled={item.disabled}
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.option,
                      item.disabled ? styles.optionDisabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.optionLabel,
                        { color: item.disabled ? theme.colors.textMuted : theme.colors.text },
                        theme.typography.bodyStrong,
                        isSelected ? styles.selectedOptionLabel : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: theme.colors.border },
                        isSelected
                          ? { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentStrong }
                          : null,
                      ]}
                    >
                      {isSelected ? <Check color={theme.colors.text} size={14} strokeWidth={3} /> : null}
                    </View>
                  </Pressable>
                );
              }}
              scrollEnabled={options.length > 6}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  control: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  disabled: {
    opacity: 0.58,
  },
  pressed: {
    opacity: 0.86,
  },
  value: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  menu: {
    width: "100%",
    maxWidth: 360,
    maxHeight: 420,
    overflow: "hidden",
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  option: {
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  optionDisabled: {
    opacity: 0.58,
  },
  optionLabel: {
    flex: 1,
  },
  selectedOptionLabel: {
    opacity: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  helperText: {
    marginTop: -2,
  },
});
