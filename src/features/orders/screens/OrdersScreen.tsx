import { router, useFocusEffect } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { useCallback, useState } from "react";
import { View } from "react-native";

import {
  listOrdersAsync,
  type OrderStatusFilter,
} from "@/features/orders/services/order.service";
import { SectionHeader } from "@/shared/components";
import { Badge, EmptyState, ListItem, Screen, SegmentedControl } from "@/shared/ui";
import type { Order } from "@/shared/types";
import { formatDisplayDate } from "@/shared/utils/date";
import { formatOrderStatus } from "@/shared/utils/labels";
import { formatMoney } from "@/shared/utils/money";

const STATUSES: OrderStatusFilter[] = ["all", "pending", "delivered", "cancelled"];

function formatOrderSubtitle(order: Order): string {
  const note = order.note?.trim();
  const shortNote = note && note.length > 48 ? `${note.slice(0, 48)}...` : note;
  const customerName = order.customerName ?? "Cliente no registrado";
  const baseSubtitle = `${customerName} - ${formatDisplayDate(order.dueDate)} - ${formatMoney(order.total)}`;

  return shortNote ? `${baseSubtitle} - Nota: ${shortNote}` : baseSubtitle;
}

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const status = STATUSES[statusIndex];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadOrdersAsync() {
        setIsLoading(true);
        const loadedOrders = await listOrdersAsync({ status });

        if (isActive) {
          setOrders(loadedOrders);
          setIsLoading(false);
        }
      }

      void loadOrdersAsync();

      return () => {
        isActive = false;
      };
    }, [status])
  );

  return (
    <Screen addAction={{ accessibilityLabel: "Crear pedido", onPress: () => router.push("/orders/new") }} title="Pedidos">
      <View style={{ gap: 12 }}>
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
      </View>

      <SectionHeader
        title="Pedidos registrados"
        subtitle={isLoading ? "Cargando pedidos..." : `${orders.length} pedidos encontrados`}
      />
      {orders.length === 0 && !isLoading ? (
        <EmptyState
          action={{ label: "Crear pedido", onPress: () => router.push("/orders/new") }}
          icon={ClipboardList}
          title="Todavia no tienes pedidos"
          description="Crea tu primer pedido para empezar a registrar ventas y entregas."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {orders.map((order) => (
          <ListItem
            key={order.id}
            onPress={() => router.push(`/orders/${order.id}`)}
            title={order.orderNumber}
            subtitle={formatOrderSubtitle(order)}
            trailing={
              <Badge
                label={formatOrderStatus(order.status)}
                tone={order.status === "delivered" ? "success" : order.status === "cancelled" ? "danger" : "warning"}
              />
            }
          />
        ))}
      </View>
    </Screen>
  );
}
