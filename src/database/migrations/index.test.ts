import { migrateDatabaseAsync } from "@/database/migrations";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";

describe("migrateDatabaseAsync", () => {
  it("creates the schema and updates pragma user_version", async () => {
    const mock = createMockDatabaseClient();

    await migrateDatabaseAsync(mock.client);

    expect(mock.getUserVersion()).toBe(6);
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS settings"))).toBe(
      true
    );
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS movements"))).toBe(
      true
    );
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS product_recipe_items"))).toBe(
      false
    );
  });

  it("migrates existing databases with expense unit price, product recipes and simplified orders", async () => {
    const mock = createMockDatabaseClient();
    mock.setUserVersion(2);

    await migrateDatabaseAsync(mock.client);

    expect(mock.getUserVersion()).toBe(6);
    expect(mock.executedStatements.some((statement) => statement.includes("ALTER TABLE expenses ADD COLUMN unit_price"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("CREATE TABLE IF NOT EXISTS product_recipe_items"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("ALTER TABLE orders RENAME TO orders_old"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("due_date TEXT NOT NULL"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("COALESCE(created_at, updated_at)"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("DROP INDEX IF EXISTS idx_expenses_category"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("supply_id TEXT NOT NULL"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("default_price REAL NOT NULL"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("ALTER TABLE product_recipe_items RENAME"))).toBe(true);
    expect(mock.executedStatements.some((statement) => statement.includes("DROP TABLE IF EXISTS product_recipe_items"))).toBe(true);
  });

  it("blocks v5 migration when expenses without supplies exist", async () => {
    const mock = createMockDatabaseClient();
    mock.setUserVersion(4);
    mock.seedLegacyExpenseWithoutSupply();

    await expect(migrateDatabaseAsync(mock.client)).rejects.toThrow("EXPENSES_WITHOUT_SUPPLY");
    expect(mock.getUserVersion()).toBe(4);
  });

  it("blocks v5 migration when supplies without established prices exist", async () => {
    const mock = createMockDatabaseClient();
    mock.setUserVersion(4);
    mock.seedLegacySupplyWithoutDefaultPrice();

    await expect(migrateDatabaseAsync(mock.client)).rejects.toThrow("SUPPLIES_WITHOUT_DEFAULT_PRICE");
    expect(mock.getUserVersion()).toBe(4);
  });
});
