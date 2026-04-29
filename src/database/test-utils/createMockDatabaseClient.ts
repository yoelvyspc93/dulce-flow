import type { DatabaseClient, RunResult, SqlParams } from "@/database/client";

type SettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_uri: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type SupplyRow = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  default_price: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type ExpenseRow = {
  id: string;
  supply_id: string | null;
  supply_name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total: number;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  payment_status: string;
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

type ProductRecipeItemRow = {
  id: string;
  product_id: string;
  supply_id: string | null;
  supply_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  created_at: string;
};

type MovementRow = {
  id: string;
  type: string;
  direction: "in" | "out";
  source_type: "order" | "expense" | "manual";
  source_id: string | null;
  amount: number;
  description: string;
  status: string;
  movement_date: string;
  created_at: string;
  updated_at: string;
  reversed_movement_id: string | null;
};

type MovementSummaryRow = {
  direction: "in" | "out";
  type: "income" | "expense" | "adjustment" | "reversal";
  source_type: "order" | "expense" | "manual";
  total: number;
};

function asString(value: unknown): string {
  return String(value);
}

function asNumber(value: unknown): number {
  return Number(value);
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function compareDesc(left: string, right: string): number {
  return right.localeCompare(left);
}

export function createMockDatabaseClient() {
  const settings = new Map<string, SettingRow>();
  const products = new Map<string, ProductRow>();
  const supplies = new Map<string, SupplyRow>();
  const expenses = new Map<string, ExpenseRow>();
  const orders = new Map<string, OrderRow>();
  const orderItems = new Map<string, OrderItemRow>();
  const productRecipeItems = new Map<string, ProductRecipeItemRow>();
  const movements = new Map<string, MovementRow>();
  let movementSummaryRows: MovementSummaryRow[] | null = null;
  let userVersion = 0;
  const executedStatements: string[] = [];

  function result(changes: number): RunResult {
    return { changes, lastInsertRowId: 0 };
  }

  const client: DatabaseClient = {
    async execAsync(source: string) {
      executedStatements.push(source.trim());

      const pragmaMatch = source.match(/PRAGMA user_version = (\d+)/);
      if (pragmaMatch) {
        userVersion = Number(pragmaMatch[1]);
      }
    },
    async runAsync(source: string, params?: SqlParams): Promise<RunResult> {
      const sql = source.trim();
      const values = params ?? [];
      executedStatements.push(sql);

      if (sql.startsWith("INSERT INTO settings")) {
        const row: SettingRow = {
          key: asString(values[0]),
          value: asString(values[1]),
          updated_at: asString(values[2]),
        };
        settings.set(row.key, row);
        return result(1);
      }

      if (sql.startsWith("INSERT INTO products")) {
        products.set(asString(values[0]), {
          id: asString(values[0]),
          name: asString(values[1]),
          price: asNumber(values[2]),
          description: nullableString(values[3]),
          image_uri: nullableString(values[4]),
          is_active: asNumber(values[5]),
          created_at: asString(values[6]),
          updated_at: asString(values[7]),
        });
        return result(1);
      }

      if (sql.startsWith("UPDATE products")) {
        const id = asString(values[6]);
        const existing = products.get(id);
        if (!existing) {
          return result(0);
        }
        products.set(id, {
          ...existing,
          name: asString(values[0]),
          price: asNumber(values[1]),
          description: nullableString(values[2]),
          image_uri: nullableString(values[3]),
          is_active: asNumber(values[4]),
          updated_at: asString(values[5]),
        });
        return result(1);
      }

      if (sql.startsWith("DELETE FROM products")) {
        return result(products.delete(asString(values[0])) ? 1 : 0);
      }

      if (sql.startsWith("INSERT INTO supplies")) {
        supplies.set(asString(values[0]), {
          id: asString(values[0]),
          name: asString(values[1]),
          unit: asString(values[2]),
          category: nullableString(values[3]),
          default_price: nullableNumber(values[4]),
          is_active: asNumber(values[5]),
          created_at: asString(values[6]),
          updated_at: asString(values[7]),
        });
        return result(1);
      }

      if (sql.startsWith("UPDATE supplies")) {
        const id = asString(values[6]);
        const existing = supplies.get(id);
        if (!existing) {
          return result(0);
        }
        supplies.set(id, {
          ...existing,
          name: asString(values[0]),
          unit: asString(values[1]),
          category: nullableString(values[2]),
          default_price: nullableNumber(values[3]),
          is_active: asNumber(values[4]),
          updated_at: asString(values[5]),
        });
        return result(1);
      }

      if (sql.startsWith("DELETE FROM supplies")) {
        return result(supplies.delete(asString(values[0])) ? 1 : 0);
      }

      if (sql.startsWith("INSERT INTO expenses")) {
        expenses.set(asString(values[0]), {
          id: asString(values[0]),
          supply_id: nullableString(values[1]),
          supply_name: asString(values[2]),
          category: asString(values[3]),
          quantity: nullableNumber(values[4]),
          unit: nullableString(values[5]),
          unit_price: nullableNumber(values[6]),
          total: asNumber(values[7]),
          status: asString(values[8]),
          note: nullableString(values[9]),
          created_at: asString(values[10]),
          updated_at: asString(values[11]),
        });
        return result(1);
      }

      if (sql.startsWith("UPDATE expenses") && sql.includes("SET supply_id")) {
        const id = asString(values[10]);
        const existing = expenses.get(id);
        if (!existing) {
          return result(0);
        }
        expenses.set(id, {
          ...existing,
          supply_id: nullableString(values[0]),
          supply_name: asString(values[1]),
          category: asString(values[2]),
          quantity: nullableNumber(values[3]),
          unit: nullableString(values[4]),
          unit_price: nullableNumber(values[5]),
          total: asNumber(values[6]),
          status: asString(values[7]),
          note: nullableString(values[8]),
          updated_at: asString(values[9]),
        });
        return result(1);
      }

      if (sql.startsWith("UPDATE expenses SET status")) {
        const id = asString(values[2]);
        const existing = expenses.get(id);
        if (!existing) {
          return result(0);
        }
        expenses.set(id, { ...existing, status: asString(values[0]), updated_at: asString(values[1]) });
        return result(1);
      }

      if (sql.startsWith("DELETE FROM expenses")) {
        return result(expenses.delete(asString(values[0])) ? 1 : 0);
      }

      if (sql.startsWith("INSERT INTO orders")) {
        orders.set(asString(values[0]), {
          id: asString(values[0]),
          order_number: asString(values[1]),
          customer_name: nullableString(values[2]),
          customer_phone: nullableString(values[3]),
          subtotal: asNumber(values[4]),
          discount: asNumber(values[5]),
          total: asNumber(values[6]),
          status: asString(values[7]),
          payment_status: asString(values[8]),
          note: nullableString(values[9]),
          delivered_at: nullableString(values[10]),
          cancelled_at: nullableString(values[11]),
          created_at: asString(values[12]),
          updated_at: asString(values[13]),
        });
        return result(1);
      }

      if (sql.startsWith("UPDATE orders") && sql.includes("SET customer_name")) {
        const id = asString(values[11]);
        const existing = orders.get(id);
        if (!existing) {
          return result(0);
        }
        orders.set(id, {
          ...existing,
          customer_name: nullableString(values[0]),
          customer_phone: nullableString(values[1]),
          subtotal: asNumber(values[2]),
          discount: asNumber(values[3]),
          total: asNumber(values[4]),
          status: asString(values[5]),
          payment_status: asString(values[6]),
          note: nullableString(values[7]),
          delivered_at: nullableString(values[8]),
          cancelled_at: nullableString(values[9]),
          updated_at: asString(values[10]),
        });
        return result(1);
      }

      if (sql.startsWith("UPDATE orders") && sql.includes("SET status")) {
        const id = asString(values[4]);
        const existing = orders.get(id);
        if (!existing) {
          return result(0);
        }
        orders.set(id, {
          ...existing,
          status: asString(values[0]),
          updated_at: asString(values[1]),
          delivered_at: nullableString(values[2]),
          cancelled_at: nullableString(values[3]),
        });
        return result(1);
      }

      if (sql.startsWith("UPDATE orders SET payment_status")) {
        const id = asString(values[2]);
        const existing = orders.get(id);
        if (!existing) {
          return result(0);
        }
        orders.set(id, { ...existing, payment_status: asString(values[0]), updated_at: asString(values[1]) });
        return result(1);
      }

      if (sql.startsWith("INSERT INTO order_items")) {
        orderItems.set(asString(values[0]), {
          id: asString(values[0]),
          order_id: asString(values[1]),
          product_id: nullableString(values[2]),
          product_name: asString(values[3]),
          quantity: asNumber(values[4]),
          unit_price: asNumber(values[5]),
          subtotal: asNumber(values[6]),
          created_at: asString(values[7]),
        });
        return result(1);
      }

      if (sql.startsWith("DELETE FROM order_items")) {
        const orderId = asString(values[0]);
        const ids = Array.from(orderItems.values())
          .filter((item) => item.order_id === orderId)
          .map((item) => item.id);
        ids.forEach((id) => orderItems.delete(id));
        return result(ids.length);
      }

      if (sql.startsWith("DELETE FROM product_recipe_items")) {
        const productId = asString(values[0]);
        const ids = Array.from(productRecipeItems.values())
          .filter((item) => item.product_id === productId)
          .map((item) => item.id);
        ids.forEach((id) => productRecipeItems.delete(id));
        return result(ids.length);
      }

      if (sql.startsWith("INSERT INTO product_recipe_items")) {
        productRecipeItems.set(asString(values[0]), {
          id: asString(values[0]),
          product_id: asString(values[1]),
          supply_id: nullableString(values[2]),
          supply_name: asString(values[3]),
          quantity: asNumber(values[4]),
          unit: asString(values[5]),
          unit_price: asNumber(values[6]),
          subtotal: asNumber(values[7]),
          created_at: asString(values[8]),
        });
        return result(1);
      }

      if (sql.startsWith("INSERT INTO movements")) {
        movementSummaryRows = null;
        movements.set(asString(values[0]), {
          id: asString(values[0]),
          type: asString(values[1]),
          direction: asString(values[2]) as "in" | "out",
          source_type: asString(values[3]) as "order" | "expense" | "manual",
          source_id: nullableString(values[4]),
          amount: asNumber(values[5]),
          description: asString(values[6]),
          status: asString(values[7]),
          movement_date: asString(values[8]),
          created_at: asString(values[9]),
          updated_at: asString(values[10]),
          reversed_movement_id: nullableString(values[11]),
        });
        return result(1);
      }

      if (sql.startsWith("UPDATE movements SET status")) {
        movementSummaryRows = null;
        const id = asString(values[2]);
        const existing = movements.get(id);
        if (!existing) {
          return result(0);
        }
        movements.set(id, { ...existing, status: asString(values[0]), updated_at: asString(values[1]) });
        return result(1);
      }

      return result(0);
    },
    async getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null> {
      const sql = source.trim();
      const values = params ?? [];
      executedStatements.push(sql);

      if (sql === "PRAGMA user_version;") {
        return { user_version: userVersion } as T;
      }

      if (sql.startsWith("SELECT * FROM settings WHERE key = ?")) {
        return (settings.get(asString(values[0])) ?? null) as T | null;
      }

      if (sql.startsWith("SELECT * FROM products WHERE id = ?")) {
        return (products.get(asString(values[0])) ?? null) as T | null;
      }

      if (sql.startsWith("SELECT COUNT(*) as count FROM order_items")) {
        const productId = asString(values[0]);
        return { count: Array.from(orderItems.values()).filter((item) => item.product_id === productId).length } as T;
      }

      if (sql.startsWith("SELECT * FROM supplies WHERE id = ?")) {
        return (supplies.get(asString(values[0])) ?? null) as T | null;
      }

      if (sql.startsWith("SELECT COUNT(*) as count FROM expenses")) {
        const supplyId = asString(values[0]);
        return { count: Array.from(expenses.values()).filter((expense) => expense.supply_id === supplyId).length } as T;
      }

      if (sql.startsWith("SELECT COUNT(*) as count FROM product_recipe_items")) {
        const supplyId = asString(values[0]);
        return {
          count: Array.from(productRecipeItems.values()).filter((item) => item.supply_id === supplyId).length,
        } as T;
      }

      if (sql.startsWith("SELECT * FROM expenses WHERE id = ?")) {
        return (expenses.get(asString(values[0])) ?? null) as T | null;
      }

      if (sql.startsWith("SELECT * FROM orders WHERE id = ?")) {
        return (orders.get(asString(values[0])) ?? null) as T | null;
      }

      if (sql.includes("FROM movements") && sql.includes("WHERE source_type = ?")) {
        const [sourceType, sourceId] = values.map(asString);
        const row =
          Array.from(movements.values())
            .filter(
              (movement) =>
                movement.source_type === sourceType &&
                movement.source_id === sourceId &&
                movement.status === "active"
            )
            .sort((left, right) => compareDesc(left.created_at, right.created_at))[0] ?? null;
        return row as T | null;
      }

      return null;
    },
    async getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]> {
      const sql = source.trim();
      const values = params ?? [];
      executedStatements.push(sql);

      if (sql.startsWith("SELECT * FROM settings WHERE key IN")) {
        const keySet = new Set(values.map(asString));
        return Array.from(settings.values())
          .filter((row) => keySet.has(row.key))
          .sort((left, right) => left.key.localeCompare(right.key)) as T[];
      }

      if (sql.startsWith("SELECT * FROM products WHERE is_active")) {
        return Array.from(products.values())
          .filter((product) => product.is_active === 1)
          .sort((left, right) => left.name.localeCompare(right.name)) as T[];
      }

      if (sql.startsWith("SELECT * FROM products ORDER BY created_at DESC")) {
        return Array.from(products.values()).sort((left, right) => compareDesc(left.created_at, right.created_at)) as T[];
      }

      if (sql.startsWith("SELECT * FROM supplies WHERE is_active")) {
        return Array.from(supplies.values())
          .filter((supply) => supply.is_active === 1)
          .sort((left, right) => left.name.localeCompare(right.name)) as T[];
      }

      if (sql.startsWith("SELECT * FROM supplies ORDER BY created_at DESC")) {
        return Array.from(supplies.values()).sort((left, right) => compareDesc(left.created_at, right.created_at)) as T[];
      }

      if (sql.startsWith("SELECT * FROM expenses ORDER BY created_at DESC")) {
        return Array.from(expenses.values()).sort((left, right) => compareDesc(left.created_at, right.created_at)) as T[];
      }

      if (sql.startsWith("SELECT * FROM orders ORDER BY created_at DESC")) {
        return Array.from(orders.values()).sort((left, right) => compareDesc(left.created_at, right.created_at)) as T[];
      }

      if (sql.startsWith("SELECT * FROM order_items WHERE order_id")) {
        const orderId = asString(values[0]);
        return Array.from(orderItems.values())
          .filter((item) => item.order_id === orderId)
          .sort((left, right) => left.created_at.localeCompare(right.created_at)) as T[];
      }

      if (sql.startsWith("SELECT * FROM product_recipe_items WHERE product_id")) {
        const productId = asString(values[0]);
        return Array.from(productRecipeItems.values())
          .filter((item) => item.product_id === productId)
          .sort((left, right) => left.created_at.localeCompare(right.created_at)) as T[];
      }

      if (sql.includes("FROM movements") && sql.includes("GROUP BY direction, type, source_type")) {
        if (movementSummaryRows) {
          return movementSummaryRows as T[];
        }

        const [startDate, endDate] = values.map(asString);
        const grouped = new Map<string, MovementSummaryRow>();
        for (const movement of movements.values()) {
          if (movement.status !== "active" || movement.movement_date < startDate || movement.movement_date > endDate) {
            continue;
          }

          const key = `${movement.direction}:${movement.type}:${movement.source_type}`;
          const existing = grouped.get(key);
          grouped.set(key, {
            direction: movement.direction,
            type: movement.type as MovementSummaryRow["type"],
            source_type: movement.source_type,
            total: (existing?.total ?? 0) + movement.amount,
          });
        }
        return Array.from(grouped.values()) as T[];
      }

      if (sql.startsWith("SELECT * FROM movements WHERE status = 'active'")) {
        const limit = Number(values[0] ?? 10);
        return Array.from(movements.values())
          .filter((movement) => movement.status === "active")
          .sort((left, right) => {
            const byMovementDate = compareDesc(left.movement_date, right.movement_date);
            return byMovementDate || compareDesc(left.created_at, right.created_at);
          })
          .slice(0, limit) as T[];
      }

      return [];
    },
    async withTransactionAsync<T>(task: (transactionClient: DatabaseClient) => Promise<T>): Promise<T> {
      return task(client);
    },
  };

  return {
    client,
    executedStatements,
    getUserVersion: () => userVersion,
    setMovementSummaryRows: (rows: MovementSummaryRow[]) => {
      movementSummaryRows = rows;
    },
    setUserVersion: (version: number) => {
      userVersion = version;
    },
  };
}
