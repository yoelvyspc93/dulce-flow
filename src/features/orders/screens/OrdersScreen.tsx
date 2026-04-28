import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import {
  listOrdersAsync,
  type OrderPeriodFilter,
  type OrderStatusFilter,
} from "@/features/orders/services/order.service";
import { SectionHeader } from "@/shared/components";
import { Badge, Button, EmptyState, ListItem, Screen } from "@/shared/ui";
import type { Order } from "@/shared/types";

const STATUSES: OrderStatusFilter[] = ["all", "pending", "delivered", "cancelled"];
const PERIODS: OrderPeriodFilter[] = ["today", "week", "month", "all"];

export function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusIndex, setStatusIndex] = useState(0);
  const [periodIndex, setPeriodIndex] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const status = STATUSES[statusIndex];
  const period = PERIODS[periodIndex];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadOrdersAsync() {
        setIsLoading(true);
        const loadedOrders = await listOrdersAsync({ status, period });

        if (isActive) {
          setOrders(loadedOrders);
          setIsLoading(false);
        }
      }

      void loadOrdersAsync();

      return () => {
        isActive = false;
      };
    }, [period, status])
  );

  return (
    <Screen title="Ordenes" subtitle="Pendientes, entregadas y canceladas con reglas financieras claras.">
      <View style={{ gap: 12 }}>
        <Button label="Crear orden" onPress={() => router.push("/orders/new")} />
        <ListItem
          onPress={() => setStatusIndex((current) => (current + 1) % STATUSES.length)}
          title="Filtro por estado"
          subtitle={status}
          trailing={<Badge label="Cambiar" />}
        />
        <ListItem
          onPress={() => setPeriodIndex((current) => (current + 1) % PERIODS.length)}
          title="Filtro por periodo"
          subtitle={period}
          trailing={<Badge label="Cambiar" />}
        />
      </View>

      <SectionHeader
        title="Ordenes registradas"
        subtitle={isLoading ? "Cargando ordenes..." : `${orders.length} ordenes encontradas`}
      />
      {orders.length === 0 && !isLoading ? (
        <EmptyState
          eyebrow="Sin ordenes"
          title="Todavia no tienes ordenes"
          description="Crea tu primera orden para empezar a registrar ventas y entregas."
        />
      ) : null}

      <View style={{ gap: 12 }}>
        {orders.map((order) => (
          <ListItem
            key={order.id}
            onPress={() => router.push(`/orders/${order.id}`)}
            title={order.orderNumber}
            subtitle={`${order.customerName ?? "Sin cliente"} - $${order.total.toFixed(2)}`}
            trailing={
              <Badge
                label={order.status}
                tone={order.status === "delivered" ? "success" : order.status === "cancelled" ? "danger" : "warning"}
              />
            }
          />
        ))}
      </View>
    </Screen>
  );
}
