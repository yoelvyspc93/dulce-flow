import { getDatabaseAsync } from "@/database/connection";
import { MovementRepository, OrderRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import { formatMoney } from "@/shared/utils/money";

import { getDashboardDateRange, loadDashboardDataAsync } from "./dashboard.service";

jest.mock("@/database/connection", () => ({
  getDatabaseAsync: jest.fn(),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

describe("getDashboardDateRange", () => {
  const now = new Date("2026-04-28T15:30:00.000Z");

  beforeEach(() => {
    jest.useRealTimers();
    mockedGetDatabaseAsync.mockReset();
  });

  it("returns the start of the current day", () => {
    const expectedStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    expect(getDashboardDateRange("today", now).startDate).toBe(expectedStart);
  });

  it("returns an open range for all", () => {
    expect(getDashboardDateRange("all", now)).toEqual({
      startDate: "0000-01-01T00:00:00.000Z",
      endDate: "2026-04-28T15:30:00.000Z",
    });
  });

  it("returns week and month ranges", () => {
    expect(getDashboardDateRange("week", now).startDate).toBe(new Date(2026, 3, 27).toISOString());
    expect(getDashboardDateRange("month", now).startDate).toBe(new Date(2026, 3, 1).toISOString());
  });

  it("formats money with fixed symbol, thousands and two decimals", () => {
    expect(formatMoney(2)).toBe("$2.00");
    expect(formatMoney(20.52)).toBe("$20.52");
    expect(formatMoney(2200.5)).toBe("$2,200.50");
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("loads dashboard summary by period and latest movements without period filter", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const movementRepository = new MovementRepository(mock.client);
    const orderRepository = new OrderRepository(mock.client);

    await movementRepository.createAsync({
      id: "movement_1",
      type: "income",
      direction: "in",
      sourceType: "order",
      sourceId: "order_1",
      amount: 20,
      description: "Ingreso",
      status: "active",
      movementDate: "2026-04-28T10:00:00.000Z",
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    });
    await movementRepository.createAsync({
      id: "movement_2",
      type: "expense",
      direction: "out",
      sourceType: "expense",
      sourceId: "expense_1",
      amount: 5,
      description: "Gasto",
      status: "active",
      movementDate: "2026-04-28T11:00:00.000Z",
      createdAt: "2026-04-28T11:00:00.000Z",
      updatedAt: "2026-04-28T11:00:00.000Z",
    });
    await movementRepository.createAsync({
      id: "movement_yesterday",
      type: "income",
      direction: "in",
      sourceType: "order",
      sourceId: "order_yesterday",
      amount: 100,
      description: "Ingreso ayer",
      status: "active",
      movementDate: "2026-04-27T12:00:00.000Z",
      createdAt: "2026-04-27T12:00:00.000Z",
      updatedAt: "2026-04-27T12:00:00.000Z",
    });
    await movementRepository.createAsync({
      id: "movement_older_1",
      type: "income",
      direction: "in",
      sourceType: "order",
      sourceId: "order_older_1",
      amount: 100,
      description: "Ingreso anterior 1",
      status: "active",
      movementDate: "2026-04-26T11:00:00.000Z",
      createdAt: "2026-04-26T11:00:00.000Z",
      updatedAt: "2026-04-26T11:00:00.000Z",
    });
    await movementRepository.createAsync({
      id: "movement_older_2",
      type: "income",
      direction: "in",
      sourceType: "order",
      sourceId: "order_older_2",
      amount: 100,
      description: "Ingreso anterior 2",
      status: "active",
      movementDate: "2026-04-25T11:00:00.000Z",
      createdAt: "2026-04-25T11:00:00.000Z",
      updatedAt: "2026-04-25T11:00:00.000Z",
    });
    await movementRepository.createAsync({
      id: "movement_old",
      type: "income",
      direction: "in",
      sourceType: "order",
      sourceId: "order_old",
      amount: 100,
      description: "Ingreso viejo",
      status: "active",
      movementDate: "2026-03-28T11:00:00.000Z",
      createdAt: "2026-03-28T11:00:00.000Z",
      updatedAt: "2026-03-28T11:00:00.000Z",
    });
    await orderRepository.createAsync({
      id: "order_1",
      orderNumber: "ORD-1",
      subtotal: 20,
      total: 20,
      status: "pending",
      dueDate: "2026-04-29T12:00:00.000Z",
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    }, []);

    jest.useFakeTimers().setSystemTime(now);
    const data = await loadDashboardDataAsync("today");
    jest.useRealTimers();

    expect(data.summary).toEqual({ totalIn: 20, totalOut: 5, netProfit: 15 });
    expect(data.latestMovements.map((movement) => movement.id)).toEqual([
      "movement_2",
      "movement_1",
      "movement_yesterday",
      "movement_older_1",
      "movement_older_2",
    ]);
    expect(data.pendingOrders.map((order) => order.id)).toEqual(["order_1"]);
  });
});
