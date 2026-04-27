import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

export function SurfaceCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
