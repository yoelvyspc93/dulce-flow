import { getDatabaseAsync } from "@/database/connection";
import { ExpenseRepository, MovementRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Expense } from "@/shared/types";

import {
  calculateExpenseTotal,
  createExpenseAsync,
  createExpenseMovement,
  deleteExpenseAsync,
  getExpensePeriodStart,
  listExpensesAsync,
  updateExpenseAsync,
} from "./expense.service";

jest.mock("@/database/connection", () => ({
  getDatabaseAsync: jest.fn(),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

const baseExpense: Expense = {
  id: "expense_1",
  supplyName: "Azucar",
  category: "ingredients",
  total: 12,
  status: "active",
  createdAt: "2026-04-28T10:00:00.000Z",
  updatedAt: "2026-04-28T10:00:00.000Z",
};

describe("expense financial rules", () => {
  beforeEach(() => {
    jest.useRealTimers();
    mockedGetDatabaseAsync.mockReset();
  });

  it("creates an outgoing movement when an expense is registered", () => {
    const movement = createExpenseMovement(baseExpense, "2026-04-28T11:00:00.000Z");

    expect(movement).toMatchObject({
      type: "expense",
      direction: "out",
      sourceType: "expense",
      sourceId: "expense_1",
      amount: 12,
      status: "active",
    });
  });

  it("calculates total from quantity and unit price", () => {
    expect(
      calculateExpenseTotal({
        quantity: 3,
        unitPrice: 4,
        total: 1,
      })
    ).toBe(12);
  });

  it("falls back to manual total when quantity or unit price are missing", () => {
    expect(calculateExpenseTotal({ total: 9 })).toBe(9);
    expect(calculateExpenseTotal({ quantity: 3, total: 9 })).toBe(9);
  });

  it("returns a start date for week filters", () => {
    expect(getExpensePeriodStart("week", new Date("2026-04-28T15:00:00.000Z"))).toEqual(
      new Date(2026, 3, 27)
    );
  });

  it("returns period starts for today, month and all", () => {
    const now = new Date("2026-04-28T15:00:00.000Z");

    expect(getExpensePeriodStart("today", now)).toEqual(new Date(2026, 3, 28));
    expect(getExpensePeriodStart("month", now)).toEqual(new Date(2026, 3, 1));
    expect(getExpensePeriodStart("all", now)).toBeNull();
  });

  it("filters expenses by category and period", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const repository = new ExpenseRepository(mock.client);

    await repository.createAsync(baseExpense);
    await repository.createAsync({
      ...baseExpense,
      id: "expense_2",
      category: "packaging",
      createdAt: "2026-04-01T10:00:00.000Z",
    });

    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));
    const expenses = await listExpensesAsync({ category: "ingredients", period: "week" });
    jest.useRealTimers();

    expect(expenses.map((expense) => expense.id)).toEqual(["expense_1"]);
  });

  it("creates an expense and matching movement in one operation", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));

    const expense = await createExpenseAsync({
      supplyId: "supply_1",
      supplyName: "Azucar",
      category: "ingredients",
      quantity: 2,
      unit: "kg",
      unitPrice: 4,
      total: 1,
      note: "",
    });

    jest.useRealTimers();
    await expect(new ExpenseRepository(mock.client).getByIdAsync(expense.id)).resolves.toMatchObject({
      total: 8,
      note: undefined,
    });
    await expect(new MovementRepository(mock.client).getActiveBySourceAsync("expense", expense.id)).resolves.toMatchObject({
      amount: 8,
      direction: "out",
    });
  });

  it("updates an expense without replacing movement when total is unchanged", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const expenseRepository = new ExpenseRepository(mock.client);
    const movementRepository = new MovementRepository(mock.client);

    await expenseRepository.createAsync(baseExpense);
    await movementRepository.createAsync(createExpenseMovement(baseExpense, "2026-04-28T11:00:00.000Z"));
    jest.useFakeTimers().setSystemTime(new Date("2026-04-29T15:00:00.000Z"));

    await updateExpenseAsync(baseExpense, {
      supplyName: "Azucar refinada",
      category: "ingredients",
      total: 12,
    });

    jest.useRealTimers();
    expect(await movementRepository.getLatestAsync()).toHaveLength(1);
    await expect(movementRepository.getActiveBySourceAsync("expense", "expense_1")).resolves.toMatchObject({
      amount: 12,
    });
  });

  it("reverses the previous movement when an expense total changes", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const expenseRepository = new ExpenseRepository(mock.client);
    const movementRepository = new MovementRepository(mock.client);

    await expenseRepository.createAsync(baseExpense);
    await movementRepository.createAsync(createExpenseMovement(baseExpense, "2026-04-28T11:00:00.000Z"));
    jest.useFakeTimers().setSystemTime(new Date("2026-04-29T15:00:00.000Z"));

    await updateExpenseAsync(baseExpense, {
      supplyName: "Azucar",
      category: "ingredients",
      total: 15,
    });

    jest.useRealTimers();
    expect((await movementRepository.getLatestAsync()).map((movement) => movement.amount)).toEqual([15]);
  });

  it("voids an expense and its movement when deleted", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const expenseRepository = new ExpenseRepository(mock.client);
    const movementRepository = new MovementRepository(mock.client);

    await expenseRepository.createAsync(baseExpense);
    await movementRepository.createAsync(createExpenseMovement(baseExpense, "2026-04-28T11:00:00.000Z"));

    await deleteExpenseAsync(baseExpense);

    await expect(expenseRepository.getByIdAsync("expense_1")).resolves.toMatchObject({ status: "voided" });
    await expect(movementRepository.getActiveBySourceAsync("expense", "expense_1")).resolves.toBeNull();
  });
});
