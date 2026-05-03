import { SlidersHorizontal } from "lucide-react-native";
import { useState, type ComponentType } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { Radio } from "./Radio";
import { useAccessibleTheme } from "./useAccessibleTheme";

type SegmentIconProps = {
  color: string;
  size: number;
  strokeWidth?: number;
};

export type SegmentedControlOption = {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: ComponentType<SegmentIconProps>;
};

type SegmentedControlProps = {
  value: string;
  options: SegmentedControlOption[];
  onValueChange: (value: string) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  menuAccessibilityLabel?: string;
  showMenuButton?: boolean;
  visibleOptionCount?: number;
};

export function SegmentedControl({
  value,
  options,
  onValueChange,
  accessibilityLabel,
  disabled = false,
  menuAccessibilityLabel = "Mostrar todas las opciones",
  showMenuButton = false,
  visibleOptionCount = options.length,
}: SegmentedControlProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const theme = useAccessibleTheme();
  const isControlDisabled = disabled || options.length === 0;
  const safeVisibleCount = Math.max(0, visibleOptionCount);
  const hasHiddenOptions = options.length > safeVisibleCount;
  const shouldShowMenuButton = showMenuButton || hasHiddenOptions;
  const visibleOptions = options.slice(0, safeVisibleCount);

  function handleSelect(option: SegmentedControlOption) {
    if (option.disabled) {
      return;
    }

    onValueChange(option.value);
    setIsMenuOpen(false);
  }

  return (
    <>
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="tablist"
        style={[styles.wrapper, isControlDisabled ? styles.disabled : null]}
      >
        <View style={styles.segmentList}>
          {visibleOptions.map((option) => {
            const isSelected = option.value === value;
            const isDisabled = isControlDisabled || option.disabled;

            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                disabled={isDisabled}
                key={option.value}
                onPress={() => handleSelect(option)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected ? { backgroundColor: theme.colors.accentStrong } : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    theme.typography.bodyStrong,
                    { color: isSelected ? theme.colors.text : theme.colors.textMuted },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {shouldShowMenuButton ? (
          <Pressable
            accessibilityLabel={menuAccessibilityLabel}
            accessibilityRole="button"
            disabled={isControlDisabled}
            onPress={() => setIsMenuOpen(true)}
            style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}
          >
            <SlidersHorizontal color={theme.colors.text} size={22} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      <Modal animationType="fade" onRequestClose={() => setIsMenuOpen(false)} transparent visible={isMenuOpen}>
        <Pressable
          onPress={() => setIsMenuOpen(false)}
          style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
        >
          <Pressable
            style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <FlatList
              data={options}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                const OptionIcon = item.icon;

                return (
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSelected, disabled: item.disabled }}
                    disabled={item.disabled}
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.menuOption,
                      item.disabled ? styles.optionDisabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <View style={styles.menuOptionContent}>
                      {OptionIcon ? <OptionIcon color={theme.colors.text} size={22} strokeWidth={2.4} /> : null}
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.menuOptionLabel,
                          theme.typography.bodyStrong,
                          { color: item.disabled ? theme.colors.textMuted : theme.colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    <Radio disabled={item.disabled} selected={isSelected} />
                  </Pressable>
                );
              }}
              scrollEnabled={options.length > 6}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  segmentList: {
    minWidth: 40,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  option: {
    minHeight: 40,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  label: {
    textAlign: "center"
  },
  menuButton: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: spacing.md,
    paddingTop: 100,
  },
  menu: {
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  menuOption: {
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  menuOptionContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  menuOptionLabel: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  optionDisabled: {
    opacity: 0.58,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.58,
  },
});
