import { getDatabaseAsync } from "@/database/connection";
import { OrderRepository, ProductRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Order, OrderItem, Product } from "@/shared/types";

import {
  createProductAsync,
  deleteProductPermanentlyAsync,
  getProductAsync,
  getProductUsageCountAsync,
  listProductsAsync,
  setProductActiveAsync,
  updateProductAsync,
} from "./product.service";

jest.mock("@/database/connection", () => ({
  getDatabaseAsync: jest.fn(),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

describe("product service", () => {
  beforeEach(() => {
    jest.useRealTimers();
    mockedGetDatabaseAsync.mockReset();
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

  it("blocks duplicated product names across active and inactive products", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);

    const product = await createProductAsync({ name: " Cake ", price: 10, description: "" });
    await expect(createProductAsync({ name: "cake", price: 12, description: "" })).rejects.toThrow(
      "PRODUCT_NAME_DUPLICATED"
    );

    const inactive = await setProductActiveAsync(product, false);
    await expect(createProductAsync({ name: "CAKE", price: 12, description: "" })).rejects.toThrow(
      "PRODUCT_NAME_DUPLICATED"
    );
    await expect(updateProductAsync(inactive, { name: " Cake ", price: 11, description: "" })).resolves.toMatchObject({
      name: "Cake",
      price: 11,
    });
  });

  it("blocks updates to another product name", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);

    await createProductAsync({ name: "Cake", price: 10, description: "" });
    const brownie = await createProductAsync({ name: "Brownie", price: 12, description: "" });

    await expect(updateProductAsync(brownie, { name: " cake ", price: 12, description: "" })).rejects.toThrow(
      "PRODUCT_NAME_DUPLICATED"
    );
  });

  it("loads a product and returns null for missing products", async () => {
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

    await expect(getProductAsync("missing")).resolves.toBeNull();
    await expect(getProductAsync("product_1")).resolves.toMatchObject({ id: "product_1" });
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
    await expect(deleteProductPermanentlyAsync(product)).rejects.toThrow("PRODUCT_HAS_HISTORY");
    await expect(productRepository.getByIdAsync("product_1")).resolves.toMatchObject({ isActive: true });
  });

  it("deletes products permanently when there is no history", async () => {
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

    await expect(productRepository.getByIdAsync("product_1")).resolves.toBeNull();
    await expect(listProductsAsync()).resolves.toEqual([]);
  });
});
