import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type ListItemProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

export function ListItem({ title, subtitle, trailing }: ListItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.bodyStrong,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.caption,
  },
});
