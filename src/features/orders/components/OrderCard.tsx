import { CalendarDays, MessageSquareText } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Order, OrderStatus } from "@/shared/types";
import { formatDisplayDate } from "@/shared/utils/date";
import { formatOrderStatus } from "@/shared/utils/labels";
import { formatMoney } from "@/shared/utils/money";
import { colors, radius, spacing, typography } from "@/theme";

type OrderCardProps = {
  order: Order;
  onPress?: () => void;
};

const statusAccentColors: Record<OrderStatus, string> = {
  pending: colors.warning,
  delivered: colors.success,
  cancelled: colors.danger,
};

export function OrderCard({ order, onPress }: OrderCardProps) {
  const customerName = order.customerName?.trim() || "Cliente no registrado";
  const note = order.note?.trim() || "Sin nota";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: statusAccentColors[order.status] },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {order.orderNumber}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {customerName} · {formatOrderStatus(order.status)}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.total}>
          {formatMoney(order.total)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaBlock}>
        <View style={styles.metaRow}>
          <CalendarDays color={colors.textMuted} size={16} strokeWidth={2} />
          <Text numberOfLines={1} style={styles.metaText}>
            {formatDisplayDate(order.dueDate)}
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
