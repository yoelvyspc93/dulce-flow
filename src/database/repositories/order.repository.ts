import type { DatabaseClient } from "@/database/client";
import type { Order, OrderItem, OrderStatus } from "@/shared/types";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  due_date: string;
  note: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
};

export type OrderListCursor = {
  createdAt: string;
  id: string;
};

function mapOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    subtotal: row.subtotal,
    total: row.total,
    status: row.status,
    dueDate: row.due_date,
    note: row.note ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderItemRow(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id ?? undefined,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    subtotal: row.subtotal,
    createdAt: row.created_at,
  };
}

export class OrderRepository {
  constructor(private readonly client: DatabaseClient) {}

  async getAllAsync(): Promise<Order[]> {
    const rows = await this.client.getAllAsync<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC;");
    return rows.map(mapOrderRow);
  }

  async getFilteredAsync(filters?: {
    status?: OrderStatus | "all";
    startDate?: string | null;
    customerQuery?: string;
    cursor?: OrderListCursor | null;
    limit?: number;
  }): Promise<Order[]> {
    const clauses: string[] = [];
    const params: (string | number | null)[] = [];

    if (filters?.status && filters.status !== "all") {
      clauses.push("status = ?");
      params.push(filters.status);
    }

    if (filters?.startDate) {
      clauses.push("created_at >= ?");
      params.push(filters.startDate);
    }

    const query = filters?.customerQuery?.trim();
    if (query) {
      clauses.push("(LOWER(COALESCE(customer_name, '')) LIKE ? OR LOWER(COALESCE(customer_phone, '')) LIKE ?)");
      const like = `%${query.toLowerCase()}%`;
      params.push(like, like);
    }

    if (filters?.cursor) {
      clauses.push("(created_at < ? OR (created_at = ? AND id < ?))");
      params.push(filters.cursor.createdAt, filters.cursor.createdAt, filters.cursor.id);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = filters?.limit ? " LIMIT ?" : "";
    if (filters?.limit) {
      params.push(filters.limit);
    }

    const rows = await this.client.getAllAsync<OrderRow>(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC, id DESC${limit};`,
      params
    );
    return rows.map(mapOrderRow);
  }

  async getPendingByDueDateAsync(limit = 5): Promise<Order[]> {
    const rows = await this.client.getAllAsync<OrderRow>(
      "SELECT * FROM orders WHERE status = 'pending' ORDER BY due_date ASC, created_at DESC LIMIT ?;",
      [limit]
    );
    return rows.map(mapOrderRow);
  }

  async getByIdAsync(id: string): Promise<Order | null> {
    const row = await this.client.getFirstAsync<OrderRow>("SELECT * FROM orders WHERE id = ? LIMIT 1;", [id]);
    return row ? mapOrderRow(row) : null;
  }

  async getItemsByOrderIdAsync(orderId: string): Promise<OrderItem[]> {
    const rows = await this.client.getAllAsync<OrderItemRow>(
      "SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC;",
      [orderId]
    );
    return rows.map(mapOrderItemRow);
  }

  async createAsync(order: Order, items: OrderItem[]): Promise<void> {
    await this.client.withTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO orders (
          id, order_number, customer_name, customer_phone, subtotal, total, status,
          due_date, note, delivered_at, cancelled_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          order.id,
          order.orderNumber,
          order.customerName ?? null,
          order.customerPhone ?? null,
          order.subtotal,
          order.total,
          order.status,
          order.dueDate,
          order.note ?? null,
          order.deliveredAt ?? null,
          order.cancelledAt ?? null,
          order.createdAt,
          order.updatedAt,
        ]
      );

      for (const item of items) {
        await transaction.runAsync(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, unit_price, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.orderId,
            item.productId ?? null,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.subtotal,
            item.createdAt,
          ]
        );
      }
    });
  }

  async updateAsync(order: Order, items: OrderItem[]): Promise<void> {
    await this.client.withTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `UPDATE orders
         SET customer_name = ?, customer_phone = ?, subtotal = ?, total = ?,
             status = ?, due_date = ?, note = ?, delivered_at = ?, cancelled_at = ?, updated_at = ?
         WHERE id = ?;`,
        [
          order.customerName ?? null,
          order.customerPhone ?? null,
          order.subtotal,
          order.total,
          order.status,
          order.dueDate,
          order.note ?? null,
          order.deliveredAt ?? null,
          order.cancelledAt ?? null,
          order.updatedAt,
          order.id,
        ]
      );

      await transaction.runAsync("DELETE FROM order_items WHERE order_id = ?;", [order.id]);

      for (const item of items) {
        await transaction.runAsync(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, unit_price, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.orderId,
            item.productId ?? null,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.subtotal,
            item.createdAt,
          ]
        );
      }
    });
  }

  async updateStatusAsync(args: {
    id: string;
    status: OrderStatus;
    updatedAt: string;
    deliveredAt?: string;
    cancelledAt?: string;
  }): Promise<void> {
    await this.client.runAsync(
      `UPDATE orders
       SET status = ?, updated_at = ?, delivered_at = ?, cancelled_at = ?
       WHERE id = ?;`,
      [args.status, args.updatedAt, args.deliveredAt ?? null, args.cancelledAt ?? null, args.id]
    );
  }
}
