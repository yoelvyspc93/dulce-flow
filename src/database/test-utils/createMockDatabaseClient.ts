import type { DatabaseClient, RunResult, SqlParams } from "@/database/client";

type SettingRow = {
  key: string;
  value: string;
  updated_at: string;
};

export function createMockDatabaseClient() {
  const settings = new Map<string, SettingRow>();
  let userVersion = 0;
  const executedStatements: string[] = [];

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
      executedStatements.push(sql);

      if (sql.startsWith("INSERT INTO settings")) {
        const values = params ?? [];
        const row: SettingRow = {
          key: String(values[0]),
          value: String(values[1]),
          updated_at: String(values[2]),
        };
        settings.set(row.key, row);
        return { changes: 1, lastInsertRowId: 0 };
      }

      return { changes: 0, lastInsertRowId: 0 };
    },
    async getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null> {
      const sql = source.trim();
      executedStatements.push(sql);

      if (sql === "PRAGMA user_version;") {
        return { user_version: userVersion } as T;
      }

      if (sql.startsWith("SELECT * FROM settings WHERE key = ?")) {
        const key = String(params?.[0]);
        return (settings.get(key) ?? null) as T | null;
      }

      return null;
    },
    async getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]> {
      const sql = source.trim();
      executedStatements.push(sql);

      if (sql.startsWith("SELECT * FROM settings WHERE key IN")) {
        return (params ?? [])
          .map((key) => settings.get(String(key)))
          .filter((row): row is SettingRow => row !== undefined) as T[];
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
    setUserVersion: (version: number) => {
      userVersion = version;
    },
  };
}
