import { CalendarDays, MessageSquareText } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Expense } from "@/shared/types";
import { formatDisplayDate } from "@/shared/utils/date";
import { formatMoney } from "@/shared/utils/money";
import { colors, radius, spacing, typography } from "@/theme";

type ExpenseCardProps = {
  expense: Expense;
  onPress?: () => void;
};

export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const note = expense.note?.trim() || "Sin nota";
  const accentColor = expense.status === "active" ? colors.success : colors.danger;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: accentColor },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {expense.supplyName}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {expense.quantity} {expense.unit} · {formatMoney(expense.unitPrice)}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.total}>
          {formatMoney(expense.total)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaBlock}>
        <View style={styles.metaRow}>
          <CalendarDays color={colors.textMuted} size={16} strokeWidth={2} />
          <Text numberOfLines={1} style={styles.metaText}>
            {formatDisplayDate(expense.createdAt)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MessageSquareText color={colors.textMuted} size={16} strokeWidth={2} />
          <Text numberOfLines={2} style={styles.metaText}>
            {note}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  metaBlock: {
    gap: spacing.md,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  metaText: {
    color: colors.textMuted,
    flex: 1,
    ...typography.caption,
  },
  pressed: {
    opacity: 0.86,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.caption,
  },
  title: {
    color: colors.text,
    ...typography.section,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  total: {
    color: colors.text,
    flexShrink: 0,
    ...typography.section,
  },
});
