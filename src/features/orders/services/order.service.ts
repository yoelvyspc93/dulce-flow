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

export function getOrderPeriodStart(period: OrderPeriodFilter, now = new Date()): Date | null {
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

export function calculateOrderTotals(items: { unitPrice: number; quantity: number }[]) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return {
    subtotal,
    total: subtotal,
  };
}

function toIsoDueDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`).toISOString();
  }

  return new Date(trimmed).toISOString();
}

export function createIncomeMovement(order: Order, now: string): Movement {
  return {
    id: createId("movement"),
    type: "income",
    direction: "in",
    sourceType: "order",
    sourceId: order.id,
    amount: order.total,
    description: `Ingreso por pedido ${order.orderNumber}`,
    status: "active",
    movementDate: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDeliveredOrder(order: Order, now: string): Order {
  return {
    ...order,
    status: "delivered",
    deliveredAt: order.deliveredAt ?? now,
    updatedAt: now,
  };
}

async function createIncomeMovementIfMissingAsync(
  movementRepository: MovementRepository,
  order: Order,
  now: string
): Promise<void> {
  const activeMovement = await movementRepository.getActiveBySourceAsync("order", order.id);
  if (!activeMovement) {
    await movementRepository.createAsync(createIncomeMovement(order, now));
  }
}

export async function listOrdersAsync(filters?: {
  status?: OrderStatusFilter;
  period?: OrderPeriodFilter;
  customerQuery?: string;
}): Promise<Order[]> {
  const database = await getDatabaseAsync();
  const status = filters?.status ?? "all";
  const period = filters?.period ?? "all";
  const start = getOrderPeriodStart(period);

  return new OrderRepository(database).getFilteredAsync({
    status,
    startDate: start?.toISOString() ?? null,
    customerQuery: filters?.customerQuery,
  });
}

export async function listPendingOrdersAsync(limit = 5): Promise<Order[]> {
  const database = await getDatabaseAsync();
  return new OrderRepository(database).getPendingByDueDateAsync(limit);
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
  const productRepository = new ProductRepository(database);
  const products = await Promise.all(parsed.items.map((item) => productRepository.getByIdAsync(item.productId)));

  if (products.some((product) => !product || !product.isActive)) {
    throw new Error("PRODUCT_NOT_AVAILABLE");
  }

  const now = new Date().toISOString();
  const { subtotal, total } = calculateOrderTotals(parsed.items);

  const order: Order = {
    id: createId("order"),
    orderNumber: createOrderNumber(),
    customerName: parsed.customerName || undefined,
    customerPhone: parsed.customerPhone || undefined,
    subtotal,
    total,
    status: "pending",
    dueDate: toIsoDueDate(parsed.dueDate),
    note: parsed.note || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const items: OrderItem[] = parsed.items.map((parsedItem, index) => {
    const product = products[index];

    if (!product) {
      throw new Error("PRODUCT_NOT_AVAILABLE");
    }

    return {
      id: createId("order_item"),
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      quantity: parsedItem.quantity,
      unitPrice: parsedItem.unitPrice,
      subtotal: parsedItem.quantity * parsedItem.unitPrice,
      createdAt: now,
    };
  });

  await new OrderRepository(database).createAsync(order, items);

  return {
    order,
    items,
  };
}

export async function updatePendingOrderAsync(order: Order, values: OrderFormValues): Promise<OrderDetails> {
  if (order.status !== "pending") {
    throw new Error("ORDER_NOT_EDITABLE");
  }

  const parsed = orderSchema.parse(values);
  const database = await getDatabaseAsync();
  const productRepository = new ProductRepository(database);
  const products = await Promise.all(parsed.items.map((item) => productRepository.getByIdAsync(item.productId)));

  if (products.some((product) => !product || !product.isActive)) {
    throw new Error("PRODUCT_NOT_AVAILABLE");
  }

  const now = new Date().toISOString();
  const { subtotal, total } = calculateOrderTotals(parsed.items);

  const updatedOrder: Order = {
    ...order,
    customerName: parsed.customerName || undefined,
    customerPhone: parsed.customerPhone || undefined,
    subtotal,
    total,
    dueDate: toIsoDueDate(parsed.dueDate),
    note: parsed.note || undefined,
    updatedAt: now,
  };

  const items: OrderItem[] = parsed.items.map((parsedItem, index) => {
    const product = products[index];

    if (!product) {
      throw new Error("PRODUCT_NOT_AVAILABLE");
    }

    return {
      id: createId("order_item"),
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      quantity: parsedItem.quantity,
      unitPrice: parsedItem.unitPrice,
      subtotal: parsedItem.quantity * parsedItem.unitPrice,
      createdAt: now,
    };
  });

  await new OrderRepository(database).updateAsync(updatedOrder, items);

  return {
    order: updatedOrder,
    items,
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
  const updatedOrder = createDeliveredOrder(order, now);

  const database = await getDatabaseAsync();

  await database.withTransactionAsync(async (transaction) => {
    const orderRepository = new OrderRepository(transaction);
    const movementRepository = new MovementRepository(transaction);

    await orderRepository.updateStatusAsync({
      id: order.id,
      status: "delivered",
      updatedAt: now,
      deliveredAt: updatedOrder.deliveredAt,
      cancelledAt: undefined,
    });
    await createIncomeMovementIfMissingAsync(movementRepository, updatedOrder, now);
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

    const originalMovement = await movementRepository.getActiveBySourceAsync("order", order.id);

    if (originalMovement) {
      await movementRepository.updateStatusAsync(originalMovement.id, "voided", now);
    }
  });

  return updatedOrder;
}
