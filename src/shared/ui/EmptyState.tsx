import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";
import { Button } from "./Button";

type EmptyStateIconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type EmptyStateProps = {
  icon: ComponentType<EmptyStateIconProps>;
  title: string;
  description: string;
  action: {
    label: string;
    onPress: () => void;
  };
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.art} pointerEvents="none">
        <View style={[styles.dot, styles.dotTop]} />
        <View style={[styles.dot, styles.dotLeft]} />
        <View style={[styles.dot, styles.dotRight]} />
        <View style={styles.sparkle}>
          <View style={styles.sparkleVertical} />
          <View style={styles.sparkleHorizontal} />
        </View>
        <View style={styles.iconCircle}>
          <Icon color={colors.textMuted} size={38} strokeWidth={2} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.action}>
        <Button label={action.label} onPress={action.onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    overflow: "hidden",
    gap: spacing.md,
  },
  art: {
    width: 220,
    height: 156,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(143, 165, 191, 0.16)",
  },
  dot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: radius.md,
    backgroundColor: "rgba(143, 165, 191, 0.58)",
  },
  dotTop: {
    left: 54,
    top: 16,
    width: 8,
    height: 8,
  },
  dotLeft: {
    left: 42,
    bottom: 40,
    width: 7,
    height: 7,
  },
  dotRight: {
    right: 44,
    bottom: 30,
    width: 6,
    height: 6,
  },
  sparkle: {
    position: "absolute",
    right: 34,
    top: 40,
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleVertical: {
    position: "absolute",
    width: 3,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: "rgba(143, 165, 191, 0.58)",
  },
  sparkleHorizontal: {
    position: "absolute",
    width: 12,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(143, 165, 191, 0.58)",
  },
  title: {
    color: colors.text,
    textAlign: "center",
    ...typography.title,
  },
  description: {
    color: colors.textMuted,
    maxWidth: 360,
    textAlign: "center",
    ...typography.body,
  },
  action: {
    width: "100%",
    maxWidth: 280,
    marginTop: spacing.md,
  },
});
