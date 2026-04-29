import { ExpenseRepository, ProductRecipeRepository, SupplyRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Expense, ProductRecipeItem, Supply } from "@/shared/types";

const baseSupply: Supply = {
  id: "supply_1",
  name: "Azucar",
  unit: "kg",
  category: "ingredients",
  defaultPrice: 4,
  isActive: true,
  createdAt: "2026-04-27T10:00:00.000Z",
  updatedAt: "2026-04-27T10:00:00.000Z",
};

describe("SupplyRepository", () => {
  it("creates, lists and reads supplies with sqlite booleans and optional fields", async () => {
    const repository = new SupplyRepository(createMockDatabaseClient().client);

    await repository.createAsync(baseSupply);
    await repository.createAsync({
      ...baseSupply,
      id: "supply_2",
      name: "Harina",
      category: undefined,
      defaultPrice: undefined,
      isActive: false,
      createdAt: "2026-04-28T10:00:00.000Z",
    });

    await expect(repository.getByIdAsync("supply_2")).resolves.toMatchObject({
      category: undefined,
      defaultPrice: undefined,
      isActive: false,
    });
    await expect((await repository.getAllAsync()).map((supply) => supply.id)).toEqual(["supply_2", "supply_1"]);
    await expect((await repository.getActiveAsync()).map((supply) => supply.name)).toEqual(["Azucar"]);
  });

  it("updates and deletes supplies", async () => {
    const repository = new SupplyRepository(createMockDatabaseClient().client);

    await repository.createAsync(baseSupply);
    await repository.updateAsync({
      ...baseSupply,
      name: "Azucar blanca",
      category: undefined,
      defaultPrice: undefined,
      isActive: false,
    });

    await expect(repository.getByIdAsync("supply_1")).resolves.toMatchObject({
      name: "Azucar blanca",
      category: undefined,
      defaultPrice: undefined,
      isActive: false,
    });

    await repository.deleteAsync("supply_1");
    await expect(repository.getByIdAsync("supply_1")).resolves.toBeNull();
  });

  it("counts usage in expenses and recipe items", async () => {
    const mock = createMockDatabaseClient();
    const supplyRepository = new SupplyRepository(mock.client);
    const expenseRepository = new ExpenseRepository(mock.client);
    const recipeRepository = new ProductRecipeRepository(mock.client);

    const expense: Expense = {
      id: "expense_1",
      supplyId: "supply_1",
      supplyName: "Azucar",
      category: "ingredients",
      total: 6,
      status: "active",
      createdAt: "2026-04-27T10:00:00.000Z",
      updatedAt: "2026-04-27T10:00:00.000Z",
    };
    const recipe: ProductRecipeItem = {
      id: "recipe_1",
      productId: "product_1",
      supplyId: "supply_1",
      supplyName: "Azucar",
      quantity: 1,
      unit: "kg",
      unitPrice: 4,
      subtotal: 4,
      createdAt: "2026-04-27T10:00:00.000Z",
    };

    await expenseRepository.createAsync(expense);
    await recipeRepository.replaceByProductIdAsync("product_1", [recipe]);

    await expect(supplyRepository.getUsageCountAsync("supply_1")).resolves.toBe(2);
  });
});
