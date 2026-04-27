import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.section,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.caption,
  },
});
