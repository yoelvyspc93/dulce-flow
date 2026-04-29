import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";
import { Button } from "@/shared/ui/Button";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={isLoading ? undefined : onCancel}>
        <Pressable style={styles.dialog} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.actions}>
            <Button disabled={isLoading} label={cancelLabel} onPress={onCancel} variant="secondary" />
            <Button disabled={isLoading} label={isLoading ? "Procesando..." : confirmLabel} onPress={onConfirm} variant={confirmVariant} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
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
