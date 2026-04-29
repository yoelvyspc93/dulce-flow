import { getDatabaseAsync } from "@/database/connection";
import { MovementRepository, OrderRepository, ProductRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { Order } from "@/shared/types";

import {
  cancelOrderAsync,
  calculateOrderTotals,
  createDeliveredOrder,
  createIncomeMovement,
  createOrderAsync,
  deliverOrderAsync,
  getOrderDetailsAsync,
  getOrderPeriodStart,
  listOrdersAsync,
  updatePendingOrderAsync,
} from "./order.service";

jest.mock("@/database/connection", () => ({
  getDatabaseAsync: jest.fn(),
}));

const mockedGetDatabaseAsync = jest.mocked(getDatabaseAsync);

const baseOrder: Order = {
  id: "order_1",
  orderNumber: "ORD-1",
  subtotal: 20,
  total: 20,
  status: "delivered",
  dueDate: "2026-04-29T12:00:00.000Z",
  createdAt: "2026-04-28T10:00:00.000Z",
  updatedAt: "2026-04-28T10:00:00.000Z",
};

describe("order financial rules", () => {
  beforeEach(() => {
    jest.useRealTimers();
    mockedGetDatabaseAsync.mockReset();
  });

  it("calculates subtotal and total", () => {
    expect(calculateOrderTotals([
      { unitPrice: 5, quantity: 3 },
      { unitPrice: 2, quantity: 4 },
    ])).toEqual({
      subtotal: 23,
      total: 23,
    });
  });

  it("creates an income movement when an order is paid", () => {
    const movement = createIncomeMovement(baseOrder, "2026-04-28T11:00:00.000Z");

    expect(movement).toMatchObject({
      type: "income",
      direction: "in",
      sourceType: "order",
      sourceId: "order_1",
      amount: 20,
      status: "active",
    });
  });

  it("marks orders as delivered in a single completion state", () => {
    expect(createDeliveredOrder(baseOrder, "2026-04-28T11:00:00.000Z")).toMatchObject({
      status: "delivered",
      deliveredAt: "2026-04-28T11:00:00.000Z",
      updatedAt: "2026-04-28T11:00:00.000Z",
    });
  });

  it("returns a start date for month filters", () => {
    expect(getOrderPeriodStart("month", new Date("2026-04-28T15:00:00.000Z"))).toEqual(
      new Date(2026, 3, 1)
    );
  });

  it("returns period starts for today, week and all", () => {
    const now = new Date("2026-04-26T15:00:00.000Z");

    expect(getOrderPeriodStart("today", now)).toEqual(new Date(2026, 3, 26));
    expect(getOrderPeriodStart("week", now)).toEqual(new Date(2026, 3, 20));
    expect(getOrderPeriodStart("all", now)).toBeNull();
  });

  it("filters orders by status, period and customer query", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const repository = new OrderRepository(mock.client);

    await repository.createAsync({ ...baseOrder, status: "pending", customerName: "Maria", customerPhone: "555" }, []);
    await repository.createAsync({
      ...baseOrder,
      id: "order_2",
      orderNumber: "ORD-2",
      status: "delivered",
      customerName: "Ana",
      customerPhone: "999",
      createdAt: "2026-04-01T10:00:00.000Z",
    }, []);

    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));
    const orders = await listOrdersAsync({ status: "pending", period: "week", customerQuery: "555" });
    jest.useRealTimers();

    expect(orders.map((order) => order.id)).toEqual(["order_1"]);
  });

  it("returns order details with items and null for missing orders", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const repository = new OrderRepository(mock.client);

    await repository.createAsync(baseOrder, [
      {
        id: "item_1",
        orderId: "order_1",
        productId: "product_1",
        productName: "Cake",
        quantity: 2,
        unitPrice: 10,
        subtotal: 20,
        createdAt: "2026-04-28T10:00:00.000Z",
      },
    ]);

    await expect(getOrderDetailsAsync("missing")).resolves.toBeNull();
    await expect(getOrderDetailsAsync("order_1")).resolves.toMatchObject({
      order: { id: "order_1" },
      items: [{ id: "item_1" }],
    });
  });

  it("creates orders only when all products are available", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const productRepository = new ProductRepository(mock.client);

    await productRepository.createAsync({
      id: "product_1",
      name: "Cake",
      price: 10,
      isActive: true,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    });

    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));
    const details = await createOrderAsync({
      customerName: " Maria ",
      customerPhone: " 555 ",
      dueDate: "2026-04-29",
      items: [{ productId: "product_1", quantity: 2, unitPrice: 10 }],
      note: "",
    });
    jest.useRealTimers();

    expect(details.order).toMatchObject({ customerName: "Maria", customerPhone: "555", total: 20 });
    expect(details.items).toEqual([
      expect.objectContaining({ productId: "product_1", productName: "Cake", subtotal: 20 }),
    ]);

    await productRepository.updateAsync({
      id: "product_1",
      name: "Cake",
      price: 10,
      isActive: false,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T16:00:00.000Z",
    });
    await expect(
      createOrderAsync({
        customerName: "Maria",
        dueDate: "2026-04-29",
        items: [{ productId: "product_1", quantity: 1, unitPrice: 10 }],
      })
    ).rejects.toThrow("PRODUCT_NOT_AVAILABLE");
  });

  it("updates only pending orders and replaces their items", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const productRepository = new ProductRepository(mock.client);
    const orderRepository = new OrderRepository(mock.client);

    await productRepository.createAsync({
      id: "product_1",
      name: "Cake",
      price: 10,
      isActive: true,
      createdAt: "2026-04-28T10:00:00.000Z",
      updatedAt: "2026-04-28T10:00:00.000Z",
    });
    const pendingOrder: Order = { ...baseOrder, status: "pending" };

    await orderRepository.createAsync(pendingOrder, []);

    const details = await updatePendingOrderAsync(pendingOrder, {
      customerName: "Maria",
      dueDate: "2026-04-30",
      items: [{ productId: "product_1", quantity: 3, unitPrice: 10 }],
    });

    expect(details.order).toMatchObject({ dueDate: "2026-04-30T12:00:00.000Z", total: 30 });
    expect(details.items).toEqual([expect.objectContaining({ quantity: 3, subtotal: 30 })]);
    await expect(updatePendingOrderAsync({ ...baseOrder, status: "delivered" }, {
      customerName: "Maria",
      dueDate: "2026-04-30",
      items: [{ productId: "product_1", quantity: 1, unitPrice: 10 }],
    })).rejects.toThrow("ORDER_NOT_EDITABLE");
  });

  it("delivers orders idempotently and creates income movement once", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const orderRepository = new OrderRepository(mock.client);
    const movementRepository = new MovementRepository(mock.client);

    const pendingOrder: Order = { ...baseOrder, status: "pending" };

    await orderRepository.createAsync(pendingOrder, []);
    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));
    const delivered = await deliverOrderAsync(pendingOrder);
    await deliverOrderAsync(delivered);
    jest.useRealTimers();

    await expect(orderRepository.getByIdAsync("order_1")).resolves.toMatchObject({
      status: "delivered",
      deliveredAt: "2026-04-28T15:00:00.000Z",
    });
    expect(await movementRepository.getLatestAsync()).toHaveLength(1);
    await expect(deliverOrderAsync({ ...baseOrder, status: "cancelled" })).rejects.toThrow(
      "CANCELLED_ORDER_CANNOT_BE_DELIVERED"
    );
  });

  it("cancels orders idempotently and voids an active income movement", async () => {
    const mock = createMockDatabaseClient();
    mockedGetDatabaseAsync.mockResolvedValue(mock.client);
    const orderRepository = new OrderRepository(mock.client);
    const movementRepository = new MovementRepository(mock.client);
    const income = createIncomeMovement(baseOrder, "2026-04-28T11:00:00.000Z");

    await orderRepository.createAsync(baseOrder, []);
    await movementRepository.createAsync(income);
    jest.useFakeTimers().setSystemTime(new Date("2026-04-28T15:00:00.000Z"));
    const cancelled = await cancelOrderAsync(baseOrder);
    const cancelledAgain = await cancelOrderAsync(cancelled);
    jest.useRealTimers();

    expect(cancelledAgain).toBe(cancelled);
    await expect(orderRepository.getByIdAsync("order_1")).resolves.toMatchObject({
      status: "cancelled",
      cancelledAt: "2026-04-28T15:00:00.000Z",
    });
    await expect(movementRepository.getLatestAsync()).resolves.toEqual([]);
  });
});
