import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

export type SqlParam = string | number | null;
export type SqlParams = SqlParam[];

export type RunResult = {
  changes: number;
  lastInsertRowId: number;
};

export interface DatabaseClient {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SqlParams): Promise<RunResult>;
  getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null>;
  getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]>;
  withTransactionAsync<T>(task: (client: DatabaseClient) => Promise<T>): Promise<T>;
}

function normalizeParams(params?: SqlParams): SqlParams {
  return params ?? [];
}

function createExpoSqliteClient(database: SQLiteDatabase): DatabaseClient {
  return {
    execAsync(source) {
      return database.execAsync(source);
    },
    runAsync(source, params) {
      return database.runAsync(source, normalizeParams(params));
    },
    getFirstAsync(source, params) {
      return database.getFirstAsync(source, normalizeParams(params));
    },
    getAllAsync(source, params) {
      return database.getAllAsync(source, normalizeParams(params));
    },
    async withTransactionAsync(task) {
      let result: Awaited<ReturnType<typeof task>> | undefined;

      await database.withTransactionAsync(async () => {
        result = await task(createExpoSqliteClient(database));
      });

      return result as Awaited<ReturnType<typeof task>>;
    },
  };
}

export async function openAppDatabaseAsync(databaseName: string): Promise<DatabaseClient> {
  const database = await openDatabaseAsync(databaseName);
  return createExpoSqliteClient(database);
}
