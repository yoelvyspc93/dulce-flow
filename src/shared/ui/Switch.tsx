import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius } from "@/theme";
import { useAccessibleTheme } from "./useAccessibleTheme";

type SwitchProps = {
  value: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  onValueChange: (value: boolean) => void;
};

export function Switch({ value, disabled = false, accessibilityLabel, onValueChange }: SwitchProps) {
  const theme = useAccessibleTheme();
  const trackColor = value ? theme.colors.accent : colors.darkGray;
  const thumbColor = value && theme.colors.accent === colors.white ? colors.black : value ? colors.white : theme.colors.textMuted;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.track,
        { backgroundColor: trackColor },
        disabled ? styles.disabled : pressed ? styles.pressed : null,
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbColor,
            transform: [{ translateX: value ? 14 : 0 }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 32,
    height: 18,
    borderRadius: radius.pill,
    padding: 0,
    justifyContent: "center",
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.58,
  },
});
