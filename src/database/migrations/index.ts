import type { DatabaseClient } from "@/database/client";
import { DATABASE_VERSION, SCHEMA_STATEMENTS } from "@/database/schema";

type Migration = {
  version: number;
  statements: string[];
};

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: SCHEMA_STATEMENTS,
  },
  {
    version: 2,
    statements: [
      "ALTER TABLE supplies ADD COLUMN default_price REAL CHECK(default_price IS NULL OR default_price > 0);",
    ],
  },
  {
    version: 3,
    statements: [
      "ALTER TABLE expenses ADD COLUMN unit_price REAL CHECK(unit_price IS NULL OR unit_price > 0);",
      `CREATE TABLE IF NOT EXISTS product_recipe_items (
        id TEXT PRIMARY KEY NOT NULL,
        product_id TEXT NOT NULL,
        supply_id TEXT,
        supply_name TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        unit_price REAL NOT NULL CHECK(unit_price > 0),
        subtotal REAL NOT NULL CHECK(subtotal > 0),
        created_at TEXT NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY(supply_id) REFERENCES supplies(id) ON DELETE SET NULL
      );`,
      "CREATE INDEX IF NOT EXISTS idx_recipe_product ON product_recipe_items(product_id);",
      "CREATE INDEX IF NOT EXISTS idx_recipe_supply ON product_recipe_items(supply_id);",
    ],
  },
  {
    version: 4,
    statements: [
      "ALTER TABLE order_items RENAME TO order_items_old;",
      "ALTER TABLE orders RENAME TO orders_old;",
      `CREATE TABLE orders (
        id TEXT PRIMARY KEY NOT NULL,
        order_number TEXT NOT NULL UNIQUE,
        customer_name TEXT,
        customer_phone TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL CHECK(status IN ('pending', 'delivered', 'cancelled')),
        due_date TEXT NOT NULL,
        note TEXT,
        delivered_at TEXT,
        cancelled_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `INSERT INTO orders (
        id, order_number, customer_name, customer_phone, subtotal, total, status,
        due_date, note, delivered_at, cancelled_at, created_at, updated_at
      )
      SELECT
        id, order_number, customer_name, customer_phone, subtotal, total, status,
        COALESCE(created_at, updated_at), note, delivered_at, cancelled_at, created_at, updated_at
      FROM orders_old;`,
      `CREATE TABLE order_items (
        id TEXT PRIMARY KEY NOT NULL,
        order_id TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit_price REAL NOT NULL CHECK(unit_price >= 0),
        subtotal REAL NOT NULL CHECK(subtotal >= 0),
        created_at TEXT NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
      );`,
      `INSERT INTO order_items (
        id, order_id, product_id, product_name, quantity, unit_price, subtotal, created_at
      )
      SELECT id, order_id, product_id, product_name, quantity, unit_price, subtotal, created_at
      FROM order_items_old;`,
      "DROP TABLE order_items_old;",
      "DROP TABLE orders_old;",
      "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);",
      "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);",
      "CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders(due_date);",
    ],
  },
  {
    version: 5,
    statements: [
      "DROP INDEX IF EXISTS idx_expenses_category;",
      "ALTER TABLE expenses RENAME TO expenses_old;",
      "ALTER TABLE product_recipe_items RENAME TO product_recipe_items_old;",
      "ALTER TABLE supplies RENAME TO supplies_old;",
      `CREATE TABLE supplies (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        default_price REAL NOT NULL CHECK(default_price > 0),
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `INSERT INTO supplies (
        id, name, unit, default_price, is_active, created_at, updated_at
      )
      SELECT id, name, unit, default_price, is_active, created_at, updated_at
      FROM supplies_old;`,
      `CREATE TABLE expenses (
        id TEXT PRIMARY KEY NOT NULL,
        supply_id TEXT NOT NULL,
        supply_name TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        unit_price REAL NOT NULL CHECK(unit_price > 0),
        total REAL NOT NULL CHECK(total > 0),
        status TEXT NOT NULL CHECK(status IN ('active', 'voided')) DEFAULT 'active',
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(supply_id) REFERENCES supplies(id) ON DELETE RESTRICT
      );`,
      `INSERT INTO expenses (
        id, supply_id, supply_name, quantity, unit, unit_price, total, status, note, created_at, updated_at
      )
      SELECT
        expenses_old.id,
        expenses_old.supply_id,
        expenses_old.supply_name,
        COALESCE(expenses_old.quantity, 1),
        COALESCE(expenses_old.unit, supplies.unit),
        COALESCE(expenses_old.unit_price, supplies.default_price),
        expenses_old.total,
        expenses_old.status,
        expenses_old.note,
        expenses_old.created_at,
        expenses_old.updated_at
      FROM expenses_old
      INNER JOIN supplies_old supplies ON supplies.id = expenses_old.supply_id;`,
      `CREATE TABLE product_recipe_items (
        id TEXT PRIMARY KEY NOT NULL,
        product_id TEXT NOT NULL,
        supply_id TEXT,
        supply_name TEXT NOT NULL,
        quantity REAL NOT NULL CHECK(quantity > 0),
        unit TEXT NOT NULL,
        unit_price REAL NOT NULL CHECK(unit_price > 0),
        subtotal REAL NOT NULL CHECK(subtotal > 0),
        created_at TEXT NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY(supply_id) REFERENCES supplies(id) ON DELETE SET NULL
      );`,
      `INSERT INTO product_recipe_items (
        id, product_id, supply_id, supply_name, quantity, unit, unit_price, subtotal, created_at
      )
      SELECT id, product_id, supply_id, supply_name, quantity, unit, unit_price, subtotal, created_at
      FROM product_recipe_items_old;`,
      "DROP TABLE expenses_old;",
      "DROP TABLE product_recipe_items_old;",
      "DROP TABLE supplies_old;",
      "CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);",
      "CREATE INDEX IF NOT EXISTS idx_recipe_product ON product_recipe_items(product_id);",
      "CREATE INDEX IF NOT EXISTS idx_recipe_supply ON product_recipe_items(supply_id);",
    ],
  },
  {
    version: 6,
    statements: [
      "DROP INDEX IF EXISTS idx_recipe_product;",
      "DROP INDEX IF EXISTS idx_recipe_supply;",
      "DROP TABLE IF EXISTS product_recipe_items;",
    ],
  },
];

async function assertCanApplyMigrationAsync(client: DatabaseClient, version: number): Promise<void> {
  if (version !== 5) {
    return;
  }

  const expensesWithoutSupply = await client.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM expenses WHERE supply_id IS NULL;"
  );
  if ((expensesWithoutSupply?.count ?? 0) > 0) {
    throw new Error("EXPENSES_WITHOUT_SUPPLY");
  }

  const suppliesWithoutDefaultPrice = await client.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM supplies WHERE default_price IS NULL OR default_price <= 0;"
  );
  if ((suppliesWithoutDefaultPrice?.count ?? 0) > 0) {
    throw new Error("SUPPLIES_WITHOUT_DEFAULT_PRICE");
  }
}

export async function migrateDatabaseAsync(client: DatabaseClient): Promise<void> {
  const row = await client.getFirstAsync<{ user_version: number }>("PRAGMA user_version;");
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await client.withTransactionAsync(async (transaction) => {
      for (const statement of SCHEMA_STATEMENTS) {
        await transaction.execAsync(statement);
      }

      await transaction.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    });
    return;
  }

  const pendingMigrations = MIGRATIONS.filter((migration) => migration.version > currentVersion);

  await client.withTransactionAsync(async (transaction) => {
    for (const migration of pendingMigrations) {
      await assertCanApplyMigrationAsync(transaction, migration.version);

      for (const statement of migration.statements) {
        await transaction.execAsync(statement);
      }

      await transaction.execAsync(`PRAGMA user_version = ${migration.version};`);
    }
  });
}
