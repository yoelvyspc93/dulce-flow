import { StyleSheet, Text } from "react-native";

import { colors, typography } from "@/theme";

type AmountTextProps = {
  amount: string;
  tone?: "default" | "success" | "danger";
};

export function AmountText({ amount, tone = "default" }: AmountTextProps) {
  return <Text style={[styles.base, toneStyles[tone]]}>{amount}</Text>;
}

const styles = StyleSheet.create({
  base: {
    ...typography.title,
  },
  default: {
    color: colors.text,
  },
  success: {
    color: colors.success,
  },
  danger: {
    color: colors.danger,
  },
});

const toneStyles = StyleSheet.create({
  default: styles.default,
  success: styles.success,
  danger: styles.danger,
});
