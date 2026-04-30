import { getDatabaseAsync } from "@/database/connection";
import { MovementRepository, OrderRepository, type DashboardSummary } from "@/database/repositories";
import type { Movement, Order } from "@/shared/types";

export type DashboardPeriodFilter = "today" | "week" | "month" | "all";

export type DashboardData = {
  summary: DashboardSummary;
  latestMovements: Movement[];
  pendingOrders: Order[];
  range: {
    startDate: string;
    endDate: string;
  };
};

function startOfToday(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getDashboardDateRange(period: DashboardPeriodFilter, now = new Date()) {
  const endDate = now.toISOString();

  if (period === "all") {
    return {
      startDate: "0000-01-01T00:00:00.000Z",
      endDate,
    };
  }

  if (period === "today") {
    return {
      startDate: startOfToday(now).toISOString(),
      endDate,
    };
  }

  if (period === "week") {
    const today = startOfToday(now);
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;
    today.setDate(today.getDate() - diff);

    return {
      startDate: today.toISOString(),
      endDate,
    };
  }

  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    endDate,
  };
}

export async function loadDashboardDataAsync(period: DashboardPeriodFilter): Promise<DashboardData> {
  const database = await getDatabaseAsync();
  const movementRepository = new MovementRepository(database);
  const orderRepository = new OrderRepository(database);
  const range = getDashboardDateRange(period);

  const [summary, latestMovements, pendingOrders] = await Promise.all([
    movementRepository.getSummaryByDateRangeAsync(range.startDate, range.endDate),
    movementRepository.getLatestAsync(5),
    orderRepository.getPendingByDueDateAsync(5),
  ]);

  return {
    summary,
    latestMovements,
    pendingOrders,
    range,
  };
}

export function formatAmount(amount: number, currency = "USD"): string {
  return `${currency} ${amount.toFixed(2)}`;
}
