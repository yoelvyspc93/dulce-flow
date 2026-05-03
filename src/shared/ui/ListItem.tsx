import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme";
import { useAccessibleTheme } from "./useAccessibleTheme";

type ListItemProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
};

export function ListItem({ title, subtitle, trailing, onPress }: ListItemProps) {
  const theme = useAccessibleTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.textBlock}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }, theme.typography.bodyStrong]}>{title}</Text>
        {subtitle ? <Text numberOfLines={2} style={[styles.subtitle, { color: theme.colors.textMuted }, theme.typography.caption]}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.86,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    flexShrink: 1,
  },
  subtitle: {
    flexShrink: 1,
  },
});
