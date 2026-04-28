import { getDatabaseAsync } from "@/database/connection";
import { MovementRepository, OrderRepository, ProductRepository } from "@/database/repositories";
import { createId } from "@/shared/utils/id";
import type { Movement, Order, OrderItem, OrderStatus } from "@/shared/types";

import { orderSchema, type OrderFormValues } from "../validations/order.schema";

export type OrderStatusFilter = OrderStatus | "all";
export type OrderPeriodFilter = "today" | "week" | "month" | "all";

export type OrderDetails = {
  order: Order;
  items: OrderItem[];
};

function startOfToday(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getPeriodStart(period: OrderPeriodFilter, now = new Date()): Date | null {
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

function createOrderNumber(now = new Date()): string {
  return `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-6)}`;
}

function createIncomeMovement(order: Order, now: string): Movement {
  return {
    id: createId("movement"),
    type: "income",
    direction: "in",
    sourceType: "order",
    sourceId: order.id,
    amount: order.total,
    description: `Ingreso por orden ${order.orderNumber}`,
    status: "active",
    movementDate: now,
    createdAt: now,
    updatedAt: now,
  };
}

function createOrderReversalMovement(order: Order, originalMovement: Movement, now: string): Movement {
  return {
    id: createId("movement"),
    type: "reversal",
    direction: "out",
    sourceType: "order",
    sourceId: order.id,
    amount: originalMovement.amount,
    description: `Reverso por cancelacion de orden ${order.orderNumber}`,
    status: "active",
    movementDate: now,
    createdAt: now,
    updatedAt: now,
    reversedMovementId: originalMovement.id,
  };
}

export async function listOrdersAsync(filters?: {
  status?: OrderStatusFilter;
  period?: OrderPeriodFilter;
  customerQuery?: string;
}): Promise<Order[]> {
  const database = await getDatabaseAsync();
  const orders = await new OrderRepository(database).getAllAsync();
  const status = filters?.status ?? "all";
  const period = filters?.period ?? "all";
  const customerQuery = filters?.customerQuery?.trim().toLowerCase() ?? "";
  const start = getPeriodStart(period);

  return orders.filter((order) => {
    const matchesStatus = status === "all" || order.status === status;
    const matchesPeriod = start === null || new Date(order.createdAt) >= start;
    const matchesCustomer =
      !customerQuery ||
      (order.customerName?.toLowerCase().includes(customerQuery) ?? false) ||
      (order.customerPhone?.toLowerCase().includes(customerQuery) ?? false);

    return matchesStatus && matchesPeriod && matchesCustomer;
  });
}

export async function getOrderDetailsAsync(id: string): Promise<OrderDetails | null> {
  const database = await getDatabaseAsync();
  const repository = new OrderRepository(database);
  const order = await repository.getByIdAsync(id);

  if (!order) {
    return null;
  }

  return {
    order,
    items: await repository.getItemsByOrderIdAsync(id),
  };
}

export async function createOrderAsync(values: OrderFormValues): Promise<OrderDetails> {
  const parsed = orderSchema.parse(values);
  const database = await getDatabaseAsync();
  const product = await new ProductRepository(database).getByIdAsync(parsed.productId);

  if (!product || !product.isActive) {
    throw new Error("PRODUCT_NOT_AVAILABLE");
  }

  const now = new Date().toISOString();
  const subtotal = product.price * parsed.quantity;
  const total = subtotal - parsed.discount;

  if (parsed.discount > subtotal) {
    throw new Error("DISCOUNT_EXCEEDS_SUBTOTAL");
  }

  const order: Order = {
    id: createId("order"),
    orderNumber: createOrderNumber(),
    customerName: parsed.customerName || undefined,
    customerPhone: parsed.customerPhone || undefined,
    subtotal,
    discount: parsed.discount,
    total,
    status: "pending",
    paymentStatus: parsed.paymentStatus,
    note: parsed.note || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const item: OrderItem = {
    id: createId("order_item"),
    orderId: order.id,
    productId: product.id,
    productName: product.name,
    quantity: parsed.quantity,
    unitPrice: product.price,
    subtotal,
    createdAt: now,
  };

  await new OrderRepository(database).createAsync(order, [item]);

  return {
    order,
    items: [item],
  };
}

export async function updatePendingOrderAsync(order: Order, values: OrderFormValues): Promise<OrderDetails> {
  if (order.status !== "pending") {
    throw new Error("ORDER_NOT_EDITABLE");
  }

  const parsed = orderSchema.parse(values);
  const database = await getDatabaseAsync();
  const product = await new ProductRepository(database).getByIdAsync(parsed.productId);

  if (!product || !product.isActive) {
    throw new Error("PRODUCT_NOT_AVAILABLE");
  }

  const now = new Date().toISOString();
  const subtotal = product.price * parsed.quantity;

  if (parsed.discount > subtotal) {
    throw new Error("DISCOUNT_EXCEEDS_SUBTOTAL");
  }

  const updatedOrder: Order = {
    ...order,
    customerName: parsed.customerName || undefined,
    customerPhone: parsed.customerPhone || undefined,
    subtotal,
    discount: parsed.discount,
    total: subtotal - parsed.discount,
    paymentStatus: parsed.paymentStatus,
    note: parsed.note || undefined,
    updatedAt: now,
  };

  const item: OrderItem = {
    id: createId("order_item"),
    orderId: order.id,
    productId: product.id,
    productName: product.name,
    quantity: parsed.quantity,
    unitPrice: product.price,
    subtotal,
    createdAt: now,
  };

  await new OrderRepository(database).updateAsync(updatedOrder, [item]);

  return {
    order: updatedOrder,
    items: [item],
  };
}

export async function deliverOrderAsync(order: Order): Promise<Order> {
  if (order.status === "delivered") {
    return order;
  }

  if (order.status === "cancelled") {
    throw new Error("CANCELLED_ORDER_CANNOT_BE_DELIVERED");
  }

  const now = new Date().toISOString();
  const updatedOrder: Order = {
    ...order,
    status: "delivered",
    deliveredAt: now,
    updatedAt: now,
  };

  const database = await getDatabaseAsync();

  await database.withTransactionAsync(async (transaction) => {
    await new OrderRepository(transaction).updateStatusAsync({
      id: order.id,
      status: "delivered",
      updatedAt: now,
      deliveredAt: now,
      cancelledAt: undefined,
    });
    await new MovementRepository(transaction).createAsync(createIncomeMovement(updatedOrder, now));
  });

  return updatedOrder;
}

export async function cancelOrderAsync(order: Order): Promise<Order> {
  if (order.status === "cancelled") {
    return order;
  }

  const now = new Date().toISOString();
  const updatedOrder: Order = {
    ...order,
    status: "cancelled",
    cancelledAt: now,
    updatedAt: now,
  };

  const database = await getDatabaseAsync();

  await database.withTransactionAsync(async (transaction) => {
    const orderRepository = new OrderRepository(transaction);
    const movementRepository = new MovementRepository(transaction);

    await orderRepository.updateStatusAsync({
      id: order.id,
      status: "cancelled",
      updatedAt: now,
      deliveredAt: order.deliveredAt,
      cancelledAt: now,
    });

    if (order.status === "delivered") {
      const originalMovement = await movementRepository.getActiveBySourceAsync("order", order.id);

      if (originalMovement) {
        await movementRepository.updateStatusAsync(originalMovement.id, "reversed", now);
        await movementRepository.createAsync(createOrderReversalMovement(order, originalMovement, now));
      }
    }
  });

  return updatedOrder;
}
