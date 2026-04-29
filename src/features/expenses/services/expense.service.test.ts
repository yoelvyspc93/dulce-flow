import { getDatabaseAsync } from "@/database/connection";
import { ExpenseRepository, MovementRepository, SupplyRepository } from "@/database/repositories";
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
  supplyId: "supply_1",
  supplyName: "Azucar",
  quantity: 1,
  unit: "kg",
  unitPrice: 12,
  total: 12,
  status: "active",
  createdAt: "2026-04-28T10:00:00.000Z",
  updatedAt: "2026-04-28T10:00:00.000Z",
};

async function seedBaseSupplyAsync(mock: ReturnType<typeof createMockDatabaseClient>) {
  await new SupplyRepository(mock.client).createAsync({
    id: "supply_1",
    name: "Azucar",
    unit: "kg",
    defaultPrice: 12,
    isActive: true,
    createdAt: "2026-04-28T10:00:00.000Z",
    updatedAt: "2026-04-28T10:00:00.000Z",
  });
}

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
    })
    ).toBe(12);
  });

  it("rounds calculated totals to two decimals", () => {
    expect(calculateExpenseTotal({ quantity: 3, unitPrice: 3.335 })).toBe(10.01);
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

  it("filters expenses by period", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const repository = new ExpenseRepository(mock.client);

    await repository.createAsync(baseExpense);
    await repository.createAsync({
      ...baseExpense,
      id: "expense_2",
      createdAt: "2026-04-01T10:00:00.000Z",
    });

    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));
    const expenses = await listExpensesAsync({ period: "week" });
    jest.useRealTimers();

    expect(expenses.map((expense) => expense.id)).toEqual(["expense_1"]);
  });

  it("creates an expense and matching movement in one operation", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    await new SupplyRepository(mock.client).createAsync({
      id: "supply_1",
      name: "Azucar catalogo",
      unit: "lb",
      defaultPrice: 4,
      isActive: true,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    });
    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));

    const expense = await createExpenseAsync({
      supplyId: "supply_1",
      supplyName: "Azucar",
      quantity: 1,
      unit: "lb",
      unitPrice: 4,
      note: "",
    });

    jest.useRealTimers();
    await expect(new ExpenseRepository(mock.client).getByIdAsync(expense.id)).resolves.toMatchObject({
      supplyName: "Azucar catalogo",
      unit: "lb",
      quantity: 1,
      unitPrice: 4,
      total: 4,
      note: undefined,
    });
    await expect(new MovementRepository(mock.client).getActiveBySourceAsync("expense", expense.id)).resolves.toMatchObject({
      amount: 4,
      direction: "out",
    });
  });

  it("updates an expense without replacing movement when total is unchanged", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const expenseRepository = new ExpenseRepository(mock.client);
    const movementRepository = new MovementRepository(mock.client);

    await seedBaseSupplyAsync(mock);
    await expenseRepository.createAsync(baseExpense);
    await movementRepository.createAsync(createExpenseMovement(baseExpense, "2026-04-28T11:00:00.000Z"));
    jest.useFakeTimers().setSystemTime(new Date("2026-04-29T15:00:00.000Z"));

    await updateExpenseAsync(baseExpense, {
      supplyId: "supply_1",
      supplyName: "Azucar refinada",
      quantity: 1,
      unit: "kg",
      unitPrice: 12,
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

    await seedBaseSupplyAsync(mock);
    await expenseRepository.createAsync(baseExpense);
    await movementRepository.createAsync(createExpenseMovement(baseExpense, "2026-04-28T11:00:00.000Z"));
    jest.useFakeTimers().setSystemTime(new Date("2026-04-29T15:00:00.000Z"));

    await updateExpenseAsync(baseExpense, {
      supplyId: "supply_1",
      supplyName: "Azucar",
      quantity: 1,
      unit: "kg",
      unitPrice: 15,
    });

    jest.useRealTimers();
    expect((await movementRepository.getLatestAsync()).map((movement) => movement.amount)).toEqual([15]);
  });

  it("creates a movement when an edited expense has no active movement", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const expenseRepository = new ExpenseRepository(mock.client);
    const movementRepository = new MovementRepository(mock.client);

    await seedBaseSupplyAsync(mock);
    await expenseRepository.createAsync(baseExpense);

    await updateExpenseAsync(baseExpense, {
      supplyId: "supply_1",
      supplyName: "Azucar",
      quantity: 1,
      unit: "kg",
      unitPrice: 12,
    });

    await expect(movementRepository.getActiveBySourceAsync("expense", "expense_1")).resolves.toMatchObject({
      amount: 12,
    });
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
