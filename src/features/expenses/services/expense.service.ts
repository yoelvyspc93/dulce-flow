import { getDatabaseAsync } from "@/database/connection";
import { ExpenseRepository, MovementRepository } from "@/database/repositories";
import { createId } from "@/shared/utils/id";
import type { Expense, ExpenseCategory, Movement } from "@/shared/types";

import { expenseSchema, type ExpenseFormValues } from "../validations/expense.schema";

export type ExpensePeriodFilter = "today" | "week" | "month" | "all";
export type ExpenseCategoryFilter = ExpenseCategory | "all";

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

export function createExpenseReversalMovement(expense: Expense, originalMovement: Movement, now: string): Movement {
  return {
    id: createId("movement"),
    type: "reversal",
    direction: "in",
    sourceType: "expense",
    sourceId: expense.id,
    amount: originalMovement.amount,
    description: `Reverso por anulacion de gasto ${expense.supplyName}`,
    status: "active",
    movementDate: now,
    createdAt: now,
    updatedAt: now,
    reversedMovementId: originalMovement.id,
  };
}

export async function listExpensesAsync(filters?: {
  category?: ExpenseCategoryFilter;
  period?: ExpensePeriodFilter;
}): Promise<Expense[]> {
  const database = await getDatabaseAsync();
  const expenses = await new ExpenseRepository(database).getAllAsync();
  const category = filters?.category ?? "all";
  const period = filters?.period ?? "all";
  const start = getExpensePeriodStart(period);

  return expenses.filter((expense) => {
    const matchesCategory = category === "all" || expense.category === category;
    const matchesPeriod = start === null || new Date(expense.createdAt) >= start;
    return matchesCategory && matchesPeriod;
  });
}

export async function getExpenseAsync(id: string): Promise<Expense | null> {
  const database = await getDatabaseAsync();
  return new ExpenseRepository(database).getByIdAsync(id);
}

export async function createExpenseAsync(values: ExpenseFormValues): Promise<Expense> {
  const parsed = expenseSchema.parse(values);
  const now = new Date().toISOString();
  const expense: Expense = {
    id: createId("expense"),
    supplyId: parsed.supplyId,
    supplyName: parsed.supplyName,
    category: parsed.category,
    quantity: parsed.quantity,
    unit: parsed.unit || undefined,
    total: parsed.total,
    status: "active",
    note: parsed.note || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const database = await getDatabaseAsync();

  await database.withTransactionAsync(async (transaction) => {
    await new ExpenseRepository(transaction).createAsync(expense);
    await new MovementRepository(transaction).createAsync(createExpenseMovement(expense, now));
  });

  return expense;
}

export async function updateExpenseAsync(expense: Expense, values: ExpenseFormValues): Promise<Expense> {
  const parsed = expenseSchema.parse(values);
  const now = new Date().toISOString();
  const updatedExpense: Expense = {
    ...expense,
    supplyId: parsed.supplyId,
    supplyName: parsed.supplyName,
    category: parsed.category,
    quantity: parsed.quantity,
    unit: parsed.unit || undefined,
    total: parsed.total,
    note: parsed.note || undefined,
    updatedAt: now,
  };

  const database = await getDatabaseAsync();

  await database.withTransactionAsync(async (transaction) => {
    const expenseRepository = new ExpenseRepository(transaction);
    const movementRepository = new MovementRepository(transaction);

    await expenseRepository.updateAsync(updatedExpense);

    const originalMovement = await movementRepository.getActiveBySourceAsync("expense", expense.id);
    if (originalMovement && originalMovement.amount !== updatedExpense.total) {
      await movementRepository.updateStatusAsync(originalMovement.id, "reversed", now);
      await movementRepository.createAsync(createExpenseReversalMovement(expense, originalMovement, now));
      await movementRepository.createAsync(createExpenseMovement(updatedExpense, now));
    }
  });

  return updatedExpense;
}

export async function voidExpenseAsync(expense: Expense): Promise<Expense> {
  if (expense.status === "voided") {
    return expense;
  }

  const now = new Date().toISOString();
  const voidedExpense: Expense = {
    ...expense,
    status: "voided",
    updatedAt: now,
  };

  const database = await getDatabaseAsync();

  await database.withTransactionAsync(async (transaction) => {
    const expenseRepository = new ExpenseRepository(transaction);
    const movementRepository = new MovementRepository(transaction);
    const originalMovement = await movementRepository.getActiveBySourceAsync("expense", expense.id);

    await expenseRepository.updateStatusAsync(expense.id, "voided", now);

    if (originalMovement) {
      await movementRepository.updateStatusAsync(originalMovement.id, "reversed", now);
      await movementRepository.createAsync(createExpenseReversalMovement(expense, originalMovement, now));
    }
  });

  return voidedExpense;
}
