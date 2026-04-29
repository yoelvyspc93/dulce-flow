import type { ExpenseCategory, OrderStatus } from "@/shared/types";

type OrderStatusFilter = OrderStatus | "all";
type ExpenseCategoryFilter = ExpenseCategory | "all";
type PeriodFilter = "today" | "week" | "month" | "all";

export const orderStatusLabels: Record<OrderStatusFilter, string> = {
  all: "Todos",
  pending: "Pendiente",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

export const expenseCategoryLabels: Record<ExpenseCategoryFilter, string> = {
  all: "Todas",
  ingredients: "Ingredientes",
  packaging: "Empaque",
  decoration: "Decoracion",
  transport: "Transporte",
  services: "Servicios",
  other: "Otros",
};

export const periodLabels: Record<PeriodFilter, string> = {
  today: "Hoy",
  week: "Semana",
  month: "Mes",
  all: "Todo",
};

export function formatOrderStatus(status: OrderStatusFilter): string {
  return orderStatusLabels[status];
}

export function formatExpenseCategory(category: ExpenseCategoryFilter): string {
  return expenseCategoryLabels[category];
}

export function formatPeriod(period: PeriodFilter): string {
  return periodLabels[period];
}
