import { openAppDatabaseAsync, type DatabaseClient } from "@/database/client";
import { migrateDatabaseAsync } from "@/database/migrations";
import { DATABASE_NAME } from "@/database/schema";

let databasePromise: Promise<DatabaseClient> | null = null;

async function initializeDatabaseAsync(): Promise<DatabaseClient> {
  const client = await openAppDatabaseAsync(DATABASE_NAME);
  await migrateDatabaseAsync(client);
  return client;
}

export async function getDatabaseAsync(): Promise<DatabaseClient> {
  if (!databasePromise) {
    databasePromise = initializeDatabaseAsync();
  }

  return databasePromise;
}

export function resetDatabaseForTests(): void {
  databasePromise = null;
}
