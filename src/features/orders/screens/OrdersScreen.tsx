import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { OrderCard } from "@/features/orders/components/OrderCard";
import { usePaginatedOrders } from "@/features/orders/hooks/usePaginatedOrders";
import { type OrderStatusFilter } from "@/features/orders/services/order.service";
import { SectionHeader } from "@/shared/components";
import { EmptyState, Screen, SegmentedControl } from "@/shared/ui";
import type { Order } from "@/shared/types";
import { formatOrderStatus } from "@/shared/utils/labels";
import { colors, spacing } from "@/theme";

const STATUSES: OrderStatusFilter[] = ["all", "pending", "delivered", "cancelled"];

export function OrdersScreen() {
  const [statusIndex, setStatusIndex] = useState(0);
  const status = STATUSES[statusIndex];
  const {
    items: orders,
    isInitialLoading,
    isFetchingMore,
    refresh,
    loadMore,
  } = usePaginatedOrders({ status });

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard
        order={item}
        onPress={() => router.push(`/orders/${item.id}`)}
      />
    ),
    []
  );

  return (
    <Screen
      addAction={{ accessibilityLabel: "Crear pedido", onPress: () => router.push("/orders/new") }}
      scrollable={false}
      title="Pedidos"
    >
      <FlashList
        contentContainerStyle={styles.listContent}
        data={orders}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(order) => order.id}
        ListEmptyComponent={
          isInitialLoading ? (
            <ActivityIndicator color={colors.accent} style={styles.loading} />
          ) : (
            <EmptyState
              action={{ label: "Crear pedido", onPress: () => router.push("/orders/new") }}
              icon={ClipboardList}
              title="Todavia no tienes pedidos"
              description="Crea tu primer pedido para empezar a registrar ventas y entregas."
            />
          )
        }
        ListFooterComponent={
          isFetchingMore ? <ActivityIndicator color={colors.accent} style={styles.footerLoading} /> : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl
              accessibilityLabel="Filtro por estado"
              menuAccessibilityLabel="Mostrar todos los estados"
              onValueChange={(selectedStatus) => {
                setStatusIndex(Math.max(0, STATUSES.findIndex((item) => item === selectedStatus)));
              }}
              options={STATUSES.map((item) => ({ label: formatOrderStatus(item), value: item }))}
              visibleOptionCount={3}
              value={status}
            />
            <SectionHeader
              title="Pedidos registrados"
              subtitle={isInitialLoading ? "Cargando pedidos..." : `${orders.length} pedidos cargados`}
            />
          </View>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        onRefresh={refresh}
        refreshing={isInitialLoading && orders.length > 0}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  footerLoading: {
    paddingVertical: spacing.lg,
  },
  header: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
});
