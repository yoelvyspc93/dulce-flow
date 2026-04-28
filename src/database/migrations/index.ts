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
];

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
      for (const statement of migration.statements) {
        await transaction.execAsync(statement);
      }

      await transaction.execAsync(`PRAGMA user_version = ${migration.version};`);
    }
  });
}
