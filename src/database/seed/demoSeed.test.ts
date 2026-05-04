import { seedDemoDatabaseAsync } from "@/database/seed/demoSeed";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";

type ProductRow = {
  id: string;
  is_active: number;
};

type SupplyRow = {
  id: string;
  is_active: number;
};

type OrderRow = {
  id: string;
  total: number;
  status: "pending" | "delivered" | "cancelled";
};

type OrderItemRow = {
  id: string;
  order_id: string;
  subtotal: number;
};

type ExpenseRow = {
  id: string;
  total: number;
  status: "active" | "voided";
};

type MovementRow = {
  id: string;
  source_type: "order" | "expense" | "manual";
  source_id: string | null;
  amount: number;
  status: "active" | "voided" | "reversed";
};

type SettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

const now = new Date("2026-04-30T12:00:00.000Z");

async function getSeedRows(client: ReturnType<typeof createMockDatabaseClient>["client"]) {
  return {
    products: await client.getAllAsync<ProductRow>("SELECT * FROM products ORDER BY created_at DESC;"),
    supplies: await client.getAllAsync<SupplyRow>("SELECT * FROM supplies ORDER BY created_at DESC;"),
    orders: await client.getAllAsync<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC;"),
    orderItems: await client.getAllAsync<OrderItemRow>("SELECT * FROM order_items ORDER BY created_at DESC;"),
    expenses: await client.getAllAsync<ExpenseRow>("SELECT * FROM expenses ORDER BY created_at DESC;"),
    movements: await client.getAllAsync<MovementRow>("SELECT * FROM movements ORDER BY created_at DESC;"),
  };
}

describe("seedDemoDatabaseAsync", () => {
  it("inserts a large deterministic pastry demo dataset and can be rerun without duplicates", async () => {
    const mock = createMockDatabaseClient();

    await seedDemoDatabaseAsync(mock.client, now);
    await seedDemoDatabaseAsync(mock.client, now);

    const rows = await getSeedRows(mock.client);

    expect(rows.products).toHaveLength(30);
    expect(rows.products.filter((product) => product.is_active === 0)).toHaveLength(4);
    expect(rows.supplies).toHaveLength(35);
    expect(rows.supplies.filter((supply) => supply.is_active === 0)).toHaveLength(4);
    expect(rows.orders).toHaveLength(80);
    expect(rows.orderItems.length).toBeGreaterThan(180);
    expect(rows.expenses).toHaveLength(90);
    expect(rows.movements).toHaveLength(154);
  });

  it("removes operational rows before replacing the dataset and preserves settings", async () => {
    const mock = createMockDatabaseClient();
    const timestamp = now.toISOString();

    await mock.client.runAsync(
      `INSERT INTO products (
        id, name, price, description, image_uri, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      ["product_user_1", "Producto real", 12, null, null, 1, timestamp, timestamp]
    );
    await mock.client.runAsync(
      `INSERT INTO supplies (
        id, name, unit, default_price, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      ["supply_user_1", "Insumo real", "kg", 2, 1, timestamp, timestamp]
    );
    await mock.client.runAsync(
      `INSERT INTO orders (
        id, order_number, customer_name, customer_phone, subtotal, total, status,
        due_date, note, delivered_at, cancelled_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ["order_user_1", "ORD-USER-1", "Cliente real", "555", 12, 12, "delivered", timestamp, null, timestamp, null, timestamp, timestamp]
    );
    await mock.client.runAsync(
      `INSERT INTO order_items (
        id, order_id, product_id, product_name, quantity, unit_price, subtotal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      ["order_item_user_1", "order_user_1", "product_user_1", "Producto real", 1, 12, 12, timestamp]
    );
    await mock.client.runAsync(
      `INSERT INTO expenses (
        id, supply_id, supply_name, quantity, unit, unit_price, total, status, note, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ["expense_user_1", "supply_user_1", "Insumo real", 1, "kg", 2, 2, "active", null, timestamp, timestamp]
    );
    await mock.client.runAsync(
      `INSERT INTO movements (
        id, type, direction, source_type, source_id, amount, description,
        status, movement_date, created_at, updated_at, reversed_movement_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ["movement_user_1", "income", "in", "order", "order_user_1", 12, "Ingreso real", "active", timestamp, timestamp, timestamp, null]
    );
    await mock.client.runAsync(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?);",
      ["business", "{\"name\":\"DulceFlow\"}", timestamp]
    );

    await seedDemoDatabaseAsync(mock.client, now);

    const rows = await getSeedRows(mock.client);
    const setting = await mock.client.getFirstAsync<SettingRow>("SELECT * FROM settings WHERE key = ?;", ["business"]);

    expect(rows.products.some((product) => product.id === "product_user_1")).toBe(false);
    expect(rows.supplies.some((supply) => supply.id === "supply_user_1")).toBe(false);
    expect(rows.orders.some((order) => order.id === "order_user_1")).toBe(false);
    expect(rows.orderItems.some((item) => item.id === "order_item_user_1")).toBe(false);
    expect(rows.expenses.some((expense) => expense.id === "expense_user_1")).toBe(false);
    expect(rows.movements.some((movement) => movement.id === "movement_user_1")).toBe(false);
    expect(setting).toEqual({ key: "business", value: "{\"name\":\"DulceFlow\"}", updated_at: timestamp });
    expect(rows.products).toHaveLength(30);
    expect(rows.supplies).toHaveLength(35);
    expect(rows.orders).toHaveLength(80);
    expect(rows.expenses).toHaveLength(90);
    expect(rows.movements).toHaveLength(154);
  });

  it("keeps order totals and order movements consistent with status", async () => {
    const mock = createMockDatabaseClient();
    await seedDemoDatabaseAsync(mock.client, now);
    const rows = await getSeedRows(mock.client);

    for (const order of rows.orders) {
      const itemTotal = Math.round(
        rows.orderItems
          .filter((item) => item.order_id === order.id)
          .reduce((sum, item) => sum + item.subtotal, 0) * 100
      ) / 100;

      expect(itemTotal).toBe(order.total);

      const movement = rows.movements.find(
        (candidate) => candidate.source_type === "order" && candidate.source_id === order.id
      );

      if (order.status === "pending") {
        expect(movement).toBeUndefined();
      } else {
        expect(movement?.amount).toBe(order.total);
        expect(movement?.status).toBe(order.status === "cancelled" ? "voided" : "active");
      }
    }
  });

  it("keeps expense totals and expense movements consistent with status", async () => {
    const mock = createMockDatabaseClient();
    await seedDemoDatabaseAsync(mock.client, now);
    const rows = await getSeedRows(mock.client);

    for (const expense of rows.expenses) {
      const movement = rows.movements.find(
        (candidate) => candidate.source_type === "expense" && candidate.source_id === expense.id
      );

      expect(movement?.amount).toBe(expense.total);
      expect(movement?.status).toBe(expense.status === "voided" ? "voided" : "active");
    }
  });
});
