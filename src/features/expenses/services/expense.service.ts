import { getDatabaseAsync } from "@/database/connection";
import { ExpenseRepository, MovementRepository, SupplyRepository } from "@/database/repositories";
import { createId } from "@/shared/utils/id";
import type { Expense, Movement } from "@/shared/types";

import { expenseSchema, type ExpenseFormValues } from "../validations/expense.schema";

export type ExpensePeriodFilter = "today" | "week" | "month" | "all";

function startOfToday(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getExpensePeriodStart(period: ExpensePeriodFilter, now = new Date()): Date | null {
  if (period === "all") {
    return null;
  }

  if (period === "today") {
    return startOfToday(now);
  }

  if (period === "week") {
    const today = startOfToday(now);
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;
    today.setDate(today.getDate() - diff);
    return today;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function createExpenseMovement(expense: Expense, now: string): Movement {
  return {
    id: createId("movement"),
    type: "expense",
    direction: "out",
    sourceType: "expense",
    sourceId: expense.id,
    amount: expense.total,
    description: `Gasto en ${expense.supplyName}`,
    status: "active",
    movementDate: expense.createdAt,
    createdAt: now,
    updatedAt: now,
  };
}

export function calculateExpenseTotal(values: Pick<ExpenseFormValues, "quantity" | "unitPrice">): number {
  return Math.round((values.quantity * values.unitPrice + 1e-9) * 100) / 100;
}

export async function listExpensesAsync(filters?: {
  period?: ExpensePeriodFilter;
}): Promise<Expense[]> {
  const database = await getDatabaseAsync();
  const period = filters?.period ?? "all";
  const start = getExpensePeriodStart(period);

  return new ExpenseRepository(database).getFilteredAsync({
    startDate: start?.toISOString() ?? null,
  });
}

export async function getExpenseAsync(id: string): Promise<Expense | null> {
  const database = await getDatabaseAsync();
  return new ExpenseRepository(database).getByIdAsync(id);
}

export async function createExpenseAsync(values: ExpenseFormValues): Promise<Expense> {
  const parsed = expenseSchema.parse(values);
  const now = new Date().toISOString();
  const database = await getDatabaseAsync();
  const selectedSupply = await new SupplyRepository(database).getByIdAsync(parsed.supplyId);

  if (!selectedSupply) {
    throw new Error("SUPPLY_NOT_FOUND");
  }

  const expense: Expense = {
    id: createId("expense"),
    supplyId: selectedSupply.id,
    supplyName: selectedSupply.name,
    quantity: parsed.quantity,
    unit: parsed.unit,
    unitPrice: parsed.unitPrice,
    total: calculateExpenseTotal(parsed),
    status: "active",
    note: parsed.note || undefined,
    createdAt: now,
    updatedAt: now,
  };

  await database.withTransactionAsync(async (transaction) => {
    await new ExpenseRepository(transaction).createAsync(expense);
    await new MovementRepository(transaction).createAsync(createExpenseMovement(expense, now));
  });

  return expense;
}

export async function updateExpenseAsync(expense: Expense, values: ExpenseFormValues): Promise<Expense> {
  const parsed = expenseSchema.parse(values);
  const now = new Date().toISOString();
  const database = await getDatabaseAsync();
  const selectedSupply = await new SupplyRepository(database).getByIdAsync(expense.supplyId);

  if (!selectedSupply) {
    throw new Error("SUPPLY_NOT_FOUND");
  }

  const updatedExpense: Expense = {
    ...expense,
    supplyId: selectedSupply.id,
    supplyName: selectedSupply.name,
    quantity: parsed.quantity,
    unit: parsed.unit,
    unitPrice: parsed.unitPrice,
    total: calculateExpenseTotal(parsed),
    note: parsed.note || undefined,
    updatedAt: now,
  };

  await database.withTransactionAsync(async (transaction) => {
    const expenseRepository = new ExpenseRepository(transaction);
    const movementRepository = new MovementRepository(transaction);

    await expenseRepository.updateAsync(updatedExpense);

    const originalMovement = await movementRepository.getActiveBySourceAsync("expense", expense.id);
    if (!originalMovement) {
      await movementRepository.createAsync(createExpenseMovement(updatedExpense, now));
    } else if (originalMovement.amount !== updatedExpense.total) {
      await movementRepository.updateStatusAsync(originalMovement.id, "reversed", now);
      await movementRepository.createAsync(createExpenseMovement(updatedExpense, now));
    }
  });

  return updatedExpense;
}

export async function deleteExpenseAsync(expense: Expense): Promise<void> {
  const now = new Date().toISOString();
  const database = await getDatabaseAsync();

  await database.withTransactionAsync(async (transaction) => {
    const expenseRepository = new ExpenseRepository(transaction);
    const movementRepository = new MovementRepository(transaction);
    const originalMovement = await movementRepository.getActiveBySourceAsync("expense", expense.id);

    await expenseRepository.updateStatusAsync(expense.id, "voided", now);

    if (originalMovement) {
      await movementRepository.updateStatusAsync(originalMovement.id, "voided", now);
    }
  });
}
