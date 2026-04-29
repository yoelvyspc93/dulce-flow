import type { OrderStatus } from "@/shared/types";

type OrderStatusFilter = OrderStatus | "all";
type PeriodFilter = "today" | "week" | "month" | "all";

export const orderStatusLabels: Record<OrderStatusFilter, string> = {
  all: "Todos",
  pending: "Pendiente",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

export const periodLabels: Record<PeriodFilter, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  all: "Todo el historial",
};

export function formatOrderStatus(status: OrderStatusFilter): string {
  return orderStatusLabels[status];
}

export function formatPeriod(period: PeriodFilter): string {
  return periodLabels[period];
}
