import { getDatabaseAsync } from "@/database/connection";
import { OrderRepository, ProductRecipeRepository, ProductRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Order, OrderItem, Product } from "@/shared/types";

import {
  calculateRecipeCost,
  createProductAsync,
  createProductWithRecipeAsync,
  deleteProductPermanentlyAsync,
  getProductDetailsAsync,
  getProductUsageCountAsync,
  setProductActiveAsync,
  suggestSalePrice,
  updateProductAsync,
  updateProductWithRecipeAsync,
} from "./product.service";

jest.mock("@/database/connection", () => ({
  getDatabaseAsync: jest.fn(),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

describe("product recipe pricing", () => {
  beforeEach(() => {
    jest.useRealTimers();
    mockedGetDatabaseAsync.mockReset();
  });

  it("calculates recipe cost from ingredients", () => {
    expect(
      calculateRecipeCost([
        { quantity: 2, unitPrice: 3 },
        { quantity: 0.5, unitPrice: 10 },
      ])
    ).toBe(11);
  });

  it("suggests sale price from cost and margin", () => {
    expect(suggestSalePrice(10, 30)).toBe(13);
  });

  it("returns zero suggested price for non-positive costs and rounds cents", () => {
    expect(suggestSalePrice(0, 30)).toBe(0);
    expect(suggestSalePrice(10.005, 30)).toBe(13.01);
  });

  it("creates, updates and activates products", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));

    const product = await createProductAsync({ name: " Cake ", price: 10, description: "" });
    const updated = await updateProductAsync(product, { name: "Brownie", price: 12, description: "Chocolate" });
    const inactive = await setProductActiveAsync(updated, false);

    jest.useRealTimers();
    expect(product).toMatchObject({ name: "Cake", description: undefined, isActive: true });
    expect(updated).toMatchObject({ name: "Brownie", price: 12, description: "Chocolate" });
    expect(inactive).toMatchObject({ isActive: false });
    await expect(new ProductRepository(mock.client).getByIdAsync(product.id)).resolves.toMatchObject({
      isActive: false,
    });
  });

  it("creates and updates products with recipes", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));

    const details = await createProductWithRecipeAsync({
      name: "Cake",
      price: 20,
      recipeItems: [{ supplyId: "supply_1", supplyName: "Harina", quantity: 2, unit: "kg", unitPrice: 3 }],
    });
    const updated = await updateProductWithRecipeAsync(details.product, {
      name: "Cake XL",
      price: 25,
      recipeItems: [{ supplyName: "Azucar", quantity: 1, unit: "kg", unitPrice: 4 }],
    });

    jest.useRealTimers();
    expect(details.recipeItems).toEqual([expect.objectContaining({ supplyName: "Harina", subtotal: 6 })]);
    expect(updated).toMatchObject({
      product: { name: "Cake XL", price: 25 },
      recipeItems: [expect.objectContaining({ supplyId: undefined, supplyName: "Azucar", subtotal: 4 })],
    });
    await expect(new ProductRecipeRepository(mock.client).getByProductIdAsync(details.product.id)).resolves.toEqual(
      updated.recipeItems
    );
  });

  it("loads product details and returns null for missing products", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const productRepository = new ProductRepository(mock.client);
    const recipeRepository = new ProductRecipeRepository(mock.client);

    const product: Product = {
      id: "product_1",
      name: "Cake",
      price: 10,
      isActive: true,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    };
    await productRepository.createAsync(product);
    await recipeRepository.replaceByProductIdAsync("product_1", [
      {
        id: "recipe_1",
        productId: "product_1",
        supplyName: "Harina",
        quantity: 2,
        unit: "kg",
        unitPrice: 3,
        subtotal: 6,
        createdAt: "2026-04-28T10:00:00.000Z",
      },
    ]);

    await expect(getProductDetailsAsync("missing")).resolves.toBeNull();
    await expect(getProductDetailsAsync("product_1")).resolves.toMatchObject({
      product: { id: "product_1" },
      recipeItems: [{ id: "recipe_1" }],
    });
  });

  it("blocks permanent deletion when a product has order history", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const productRepository = new ProductRepository(mock.client);
    const orderRepository = new OrderRepository(mock.client);
    const product: Product = {
      id: "product_1",
      name: "Cake",
      price: 10,
      isActive: true,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    };
    const order: Order = {
      id: "order_1",
      orderNumber: "ORD-1",
      subtotal: 10,
      total: 10,
      status: "pending",
      dueDate: "2026-04-29T12:00:00.000Z",
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    };
    const item: OrderItem = {
      id: "item_1",
      orderId: "order_1",
      productId: "product_1",
      productName: "Cake",
      quantity: 1,
      unitPrice: 10,
      subtotal: 10,
      createdAt: "2026-04-28T10:00:00.000Z",
    };

    await productRepository.createAsync(product);
    await orderRepository.createAsync(order, [item]);

    await expect(getProductUsageCountAsync("product_1")).resolves.toBe(1);
    await deleteProductPermanentlyAsync(product);
    await expect(productRepository.getByIdAsync("product_1")).resolves.toMatchObject({ isActive: false });
  });

  it("deactivates products instead of deleting permanently when there is no history", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const productRepository = new ProductRepository(mock.client);
    const product: Product = {
      id: "product_1",
      name: "Cake",
      price: 10,
      isActive: true,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    };

    await productRepository.createAsync(product);
    await deleteProductPermanentlyAsync(product);

    await expect(productRepository.getByIdAsync("product_1")).resolves.toMatchObject({ isActive: false });
  });
});
