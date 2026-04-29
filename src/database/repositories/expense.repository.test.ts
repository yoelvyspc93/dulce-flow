import { ExpenseRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Expense } from "@/shared/types";

const baseExpense: Expense = {
  id: "expense_1",
  supplyId: "supply_1",
  supplyName: "Azucar",
  quantity: 2,
  unit: "kg",
  unitPrice: 3,
  total: 6,
  status: "active",
  note: "Compra inicial",
  createdAt: "2026-04-27T10:00:00.000Z",
  updatedAt: "2026-04-27T10:00:00.000Z",
};

describe("ExpenseRepository", () => {
  it("creates, lists and reads expenses", async () => {
    const repository = new ExpenseRepository(createMockDatabaseClient().client);
    const secondExpense: Expense = {
      ...baseExpense,
      id: "expense_2",
      note: undefined,
      createdAt: "2026-04-28T10:00:00.000Z",
    };

    await repository.createAsync(baseExpense);
    await repository.createAsync(secondExpense);

    await expect(repository.getByIdAsync("expense_2")).resolves.toEqual(secondExpense);
    await expect(repository.getByIdAsync("missing")).resolves.toBeNull();
    await expect((await repository.getAllAsync()).map((expense) => expense.id)).toEqual(["expense_2", "expense_1"]);
  });

  it("updates status, updates all editable fields and deletes expenses", async () => {
    const repository = new ExpenseRepository(createMockDatabaseClient().client);

    await repository.createAsync(baseExpense);
    await repository.updateStatusAsync("expense_1", "voided", "2026-04-27T11:00:00.000Z");
    await expect(repository.getByIdAsync("expense_1")).resolves.toMatchObject({
      status: "voided",
      updatedAt: "2026-04-27T11:00:00.000Z",
    });

    await repository.updateAsync({
      ...baseExpense,
      supplyName: "Harina",
      total: 9,
      note: undefined,
      updatedAt: "2026-04-27T12:00:00.000Z",
    });
    await expect(repository.getByIdAsync("expense_1")).resolves.toMatchObject({
      supplyName: "Harina",
      total: 9,
      note: undefined,
    });

    await repository.deleteAsync("expense_1");
    await expect(repository.getByIdAsync("expense_1")).resolves.toBeNull();
  });
});
