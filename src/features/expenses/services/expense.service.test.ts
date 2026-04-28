import type { Expense, Movement } from "@/shared/types";

import {
  createExpenseMovement,
  createExpenseReversalMovement,
  getExpensePeriodStart,
} from "./expense.service";

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

  it("creates an incoming reversal when an expense is voided", () => {
    const originalMovement: Movement = {
      id: "movement_1",
      type: "expense",
      direction: "out",
      sourceType: "expense",
      sourceId: "expense_1",
      amount: 12,
      description: "Gasto",
      status: "active",
      movementDate: "2026-04-28T11:00:00.000Z",
      createdAt: "2026-04-28T11:00:00.000Z",
      updatedAt: "2026-04-28T11:00:00.000Z",
    };

    const movement = createExpenseReversalMovement(baseExpense, originalMovement, "2026-04-28T12:00:00.000Z");

    expect(movement).toMatchObject({
      type: "reversal",
      direction: "in",
      sourceType: "expense",
      sourceId: "expense_1",
      amount: 12,
      reversedMovementId: "movement_1",
    });
  });

  it("returns a start date for week filters", () => {
    expect(getExpensePeriodStart("week", new Date("2026-04-28T15:00:00.000Z"))).toEqual(
      new Date(2026, 3, 27)
    );
  });
});
