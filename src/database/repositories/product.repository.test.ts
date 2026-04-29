import { ProductRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Product } from "@/shared/types";

const baseProduct: Product = {
  id: "product_1",
  name: "Cake",
  price: 12,
  description: "Chocolate",
  imageUri: "cake.png",
  isActive: true,
  createdAt: "2026-04-27T10:00:00.000Z",
  updatedAt: "2026-04-27T10:00:00.000Z",
};

describe("ProductRepository", () => {
  it("creates products with default timestamps and maps sqlite booleans and optional fields", async () => {
    const repository = new ProductRepository(createMockDatabaseClient().client);

    jest.useFakeTimers().setSystemTime(new Date("2026-04-27T12:00:00.000Z"));
    await repository.createAsync({
      id: "product_1",
      name: "Cake",
      price: 12,
      description: undefined,
      imageUri: undefined,
      isActive: true,
    });
    jest.useRealTimers();

    await expect(repository.getByIdAsync("product_1")).resolves.toEqual({
      id: "product_1",
      name: "Cake",
      price: 12,
      description: undefined,
      imageUri: undefined,
      isActive: true,
      createdAt: "2026-04-27T12:00:00.000Z",
      updatedAt: "2026-04-27T12:00:00.000Z",
    });
  });

  it("lists all products by created date and active products by name", async () => {
    const repository = new ProductRepository(createMockDatabaseClient().client);

    await repository.createAsync(baseProduct);
    await repository.createAsync({ ...baseProduct, id: "product_2", name: "Brownie", createdAt: "2026-04-28T10:00:00.000Z" });
    await repository.createAsync({ ...baseProduct, id: "product_3", name: "Alfajor", isActive: false, createdAt: "2026-04-29T10:00:00.000Z" });

    await expect((await repository.getAllAsync()).map((product) => product.id)).toEqual([
      "product_3",
      "product_2",
      "product_1",
    ]);
    await expect((await repository.getActiveAsync()).map((product) => product.name)).toEqual(["Brownie", "Cake"]);
  });

  it("updates and deletes products", async () => {
    const repository = new ProductRepository(createMockDatabaseClient().client);

    await repository.createAsync(baseProduct);
    await repository.updateAsync({ ...baseProduct, name: "Updated", description: undefined, imageUri: undefined, isActive: false });

    await expect(repository.getByIdAsync("product_1")).resolves.toMatchObject({
      name: "Updated",
      description: undefined,
      imageUri: undefined,
      isActive: false,
    });

    await repository.deleteAsync("product_1");
    await expect(repository.getByIdAsync("product_1")).resolves.toBeNull();
  });
});
