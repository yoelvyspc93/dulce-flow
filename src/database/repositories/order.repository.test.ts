import { OrderRepository, ProductRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Order, OrderItem, Product } from "@/shared/types";

const baseOrder: Order = {
  id: "order_1",
  orderNumber: "ORD-1",
  customerName: "Maria",
  customerPhone: "555",
  subtotal: 20,
  total: 20,
  status: "pending",
  dueDate: "2026-04-29T12:00:00.000Z",
  note: "Urgente",
  createdAt: "2026-04-27T10:00:00.000Z",
  updatedAt: "2026-04-27T10:00:00.000Z",
};

const baseItem: OrderItem = {
  id: "item_1",
  orderId: "order_1",
  productId: "product_1",
  productName: "Cake",
  quantity: 2,
  unitPrice: 10,
  subtotal: 20,
  createdAt: "2026-04-27T10:00:00.000Z",
};

describe("OrderRepository", () => {
  it("creates orders with items and maps nullable fields", async () => {
    const repository = new OrderRepository(createMockDatabaseClient().client);
    const orderWithoutOptionals: Order = {
      ...baseOrder,
      customerName: undefined,
      customerPhone: undefined,
      note: undefined,
      deliveredAt: undefined,
      cancelledAt: undefined,
    };
    const itemWithoutProduct: OrderItem = { ...baseItem, productId: undefined };

    await repository.createAsync(orderWithoutOptionals, [itemWithoutProduct]);

    await expect(repository.getByIdAsync("order_1")).resolves.toEqual(orderWithoutOptionals);
    await expect(repository.getItemsByOrderIdAsync("order_1")).resolves.toEqual([itemWithoutProduct]);
    await expect(repository.getByIdAsync("missing")).resolves.toBeNull();
  });

  it("lists, updates and replaces order items", async () => {
    const repository = new OrderRepository(createMockDatabaseClient().client);

    await repository.createAsync(baseOrder, [baseItem]);
    await repository.createAsync({ ...baseOrder, id: "order_2", orderNumber: "ORD-2", createdAt: "2026-04-28T10:00:00.000Z" }, []);

    await expect((await repository.getAllAsync()).map((order) => order.id)).toEqual(["order_2", "order_1"]);

    await repository.updateAsync(
      {
        ...baseOrder,
        customerName: "Ana",
        total: 30,
        dueDate: "2026-04-30T12:00:00.000Z",
        updatedAt: "2026-04-27T11:00:00.000Z",
      },
      [{ ...baseItem, id: "item_2", quantity: 3, subtotal: 30 }]
    );

    await expect(repository.getByIdAsync("order_1")).resolves.toMatchObject({
      customerName: "Ana",
      total: 30,
      dueDate: "2026-04-30T12:00:00.000Z",
    });
    await expect((await repository.getItemsByOrderIdAsync("order_1")).map((item) => item.id)).toEqual(["item_2"]);
  });

  it("updates status", async () => {
    const repository = new OrderRepository(createMockDatabaseClient().client);

    await repository.createAsync(baseOrder, [baseItem]);
    await repository.updateStatusAsync({
      id: "order_1",
      status: "delivered",
      updatedAt: "2026-04-27T12:00:00.000Z",
      deliveredAt: "2026-04-27T12:00:00.000Z",
    });
    await expect(repository.getByIdAsync("order_1")).resolves.toMatchObject({
      status: "delivered",
      deliveredAt: "2026-04-27T12:00:00.000Z",
      cancelledAt: undefined,
    });
  });

  it("filters orders and lists pending orders by due date", async () => {
    const repository = new OrderRepository(createMockDatabaseClient().client);

    await repository.createAsync(baseOrder, []);
    await repository.createAsync({
      ...baseOrder,
      id: "order_2",
      orderNumber: "ORD-2",
      customerName: "Ana",
      status: "delivered",
      dueDate: "2026-04-28T12:00:00.000Z",
      createdAt: "2026-04-28T10:00:00.000Z",
    }, []);

    await expect(repository.getFilteredAsync({ status: "pending", customerQuery: "555" })).resolves.toEqual([
      expect.objectContaining({ id: "order_1" }),
    ]);
    await expect(repository.getPendingByDueDateAsync()).resolves.toEqual([
      expect.objectContaining({ id: "order_1" }),
    ]);
  });

  it("paginates filtered orders by created date and id cursor", async () => {
    const repository = new OrderRepository(createMockDatabaseClient().client);

    await repository.createAsync({ ...baseOrder, id: "order_a", orderNumber: "ORD-A", createdAt: "2026-04-29T10:00:00.000Z" }, []);
    await repository.createAsync({ ...baseOrder, id: "order_c", orderNumber: "ORD-C", createdAt: "2026-04-28T10:00:00.000Z" }, []);
    await repository.createAsync({ ...baseOrder, id: "order_b", orderNumber: "ORD-B", createdAt: "2026-04-28T10:00:00.000Z" }, []);
    await repository.createAsync({
      ...baseOrder,
      id: "order_old",
      orderNumber: "ORD-OLD",
      status: "delivered",
      createdAt: "2026-04-01T10:00:00.000Z",
    }, []);

    const firstPage = await repository.getFilteredAsync({
      status: "pending",
      startDate: "2026-04-27T00:00:00.000Z",
      limit: 2,
    });
    expect(firstPage.map((order) => order.id)).toEqual(["order_a", "order_c"]);

    const secondPage = await repository.getFilteredAsync({
      status: "pending",
      startDate: "2026-04-27T00:00:00.000Z",
      cursor: { createdAt: firstPage[1].createdAt, id: firstPage[1].id },
      limit: 2,
    });
    expect(secondPage.map((order) => order.id)).toEqual(["order_b"]);
  });

  it("contributes order item usage to product usage counts", async () => {
    const mock = createMockDatabaseClient();
    const orderRepository = new OrderRepository(mock.client);
    const productRepository = new ProductRepository(mock.client);
    const product: Product = {
      id: "product_1",
      name: "Cake",
      price: 10,
      isActive: true,
      createdAt: "2026-04-27T10:00:00.000Z",
      updatedAt: "2026-04-27T10:00:00.000Z",
    };

    await productRepository.createAsync(product);
    await orderRepository.createAsync(baseOrder, [baseItem]);

    await expect(productRepository.getUsageCountAsync("product_1")).resolves.toBe(1);
  });
});
