import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";
import { Button } from "@/shared/ui/Button";

type ConfirmDialogProps = {
  title: string;
  description: string;
};

export function ConfirmDialog({ title, description }: ConfirmDialogProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.actions}>
          <Button label="Cancelar" variant="secondary" />
          <Button label="Confirmar" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    borderRadius: radius.lg,
    backgroundColor: colors.overlay,
    padding: spacing.lg,
  },
  dialog: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.section,
  },
  description: {
    color: colors.textMuted,
    ...typography.body,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
