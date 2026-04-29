import { getDatabaseAsync } from "@/database/connection";
import { MovementRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";

import { formatAmount, getDashboardDateRange, loadDashboardDataAsync } from "./dashboard.service";

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

  it("formats amounts with default and custom currencies", () => {
    expect(formatAmount(12)).toBe("USD 12.00");
    expect(formatAmount(12.5, "CUP")).toBe("CUP 12.50");
  });

  it("loads dashboard summary and latest movements", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const repository = new MovementRepository(mock.client);

    await repository.createAsync({
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
    await repository.createAsync({
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

    jest.useFakeTimers().setSystemTime(now);
    const data = await loadDashboardDataAsync("today");
    jest.useRealTimers();

    expect(data.summary).toEqual({ totalIn: 20, totalOut: 5, netProfit: 15 });
    expect(data.latestMovements.map((movement) => movement.id)).toEqual(["movement_2", "movement_1"]);
  });
});
