import { migrateDatabaseAsync } from "@/database/migrations";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";

describe("migrateDatabaseAsync", () => {
  it("creates the schema and updates pragma user_version", async () => {
    const mock = createMockDatabaseClient();

    await migrateDatabaseAsync(mock.client);

    expect(mock.getUserVersion()).toBe(1);
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS settings"))).toBe(
      true
    );
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS movements"))).toBe(
      true
    );
  });
});
