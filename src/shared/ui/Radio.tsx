import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/theme";
import { useAccessibleTheme } from "./useAccessibleTheme";

type RadioProps = {
  selected: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Radio({ selected, disabled = false, accessibilityLabel }: RadioProps) {
  const theme = useAccessibleTheme();
  const dotColor = theme.colors.accent === colors.white ? colors.black : colors.white;

  return (
    <View
      accessible={accessibilityLabel ? true : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      style={[
        styles.radio,
        { borderColor: selected ? theme.colors.accent : colors.border },
        selected ? { backgroundColor: theme.colors.accent } : null,
        disabled ? styles.disabled : null,
      ]}
    >
      {selected ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
  disabled: {
    opacity: 0.58,
  },
});
