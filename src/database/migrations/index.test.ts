import { migrateDatabaseAsync } from "@/database/migrations";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";

describe("migrateDatabaseAsync", () => {
  it("creates the schema and updates pragma user_version", async () => {
    const mock = createMockDatabaseClient();

    await migrateDatabaseAsync(mock.client);

    expect(mock.getUserVersion()).toBe(3);
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS settings"))).toBe(
      true
    );
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS movements"))).toBe(
      true
    );
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS product_recipe_items"))).toBe(
      true
    );
  });

  it("migrates existing databases with expense unit price and product recipes", async () => {
    const mock = createMockDatabaseClient();
    mock.setUserVersion(2);

    await migrateDatabaseAsync(mock.client);

    expect(mock.getUserVersion()).toBe(3);
    expect(mock.executedStatements.some((statement) => statement.includes("ALTER TABLE expenses ADD COLUMN unit_price"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS product_recipe_items"))).toBe(true);
  });
});
