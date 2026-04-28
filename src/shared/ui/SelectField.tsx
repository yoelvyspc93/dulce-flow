import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";

import { colors, radius, spacing, typography } from "@/theme";

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
};

export function SelectField({ label, value, options, onValueChange, disabled = false }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      <Text style={styles.label}>{label}</Text>
      <Pressable
        disabled={isDisabled}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [styles.control, isDisabled ? styles.disabled : null, pressed ? styles.pressed : null]}
      >
        <Text numberOfLines={1} style={[styles.value, isDisabled ? styles.disabledText : null]}>
          {selectedOption?.label ?? value}
        </Text>
        <ChevronDown
          color={isDisabled ? colors.textMuted : colors.accent}
          size={18}
          strokeWidth={2.4}
        />
      </Pressable>
      <Modal animationType="fade" onRequestClose={() => setIsOpen(false)} transparent visible={isOpen}>
        <Pressable onPress={() => setIsOpen(false)} style={styles.modalOverlay}>
          <Pressable style={styles.menu}>
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
                        isSelected ? styles.selectedOptionLabel : null,
                        item.disabled ? styles.disabledText : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <View style={[styles.radio, isSelected ? styles.radioSelected : null]}>
                      {isSelected ? <Check color={colors.text} size={14} strokeWidth={3} /> : null}
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
    color: colors.textMuted,
    ...typography.caption,
    textTransform: "uppercase",
  },
  control: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
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
    color: colors.text,
    ...typography.body,
  },
  disabledText: {
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
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
    color: colors.text,
    ...typography.bodyStrong,
  },
  selectedOptionLabel: {
    color: colors.text,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentStrong,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
