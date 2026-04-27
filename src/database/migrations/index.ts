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
];

export async function migrateDatabaseAsync(client: DatabaseClient): Promise<void> {
  const row = await client.getFirstAsync<{ user_version: number }>("PRAGMA user_version;");
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
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
