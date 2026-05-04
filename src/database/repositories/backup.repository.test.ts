import { BackupRepository } from "@/database/repositories";
import { createMockDatabaseClient } from "@/database/test-utils/createMockDatabaseClient";
import type { DulceFlowBackupData } from "@/features/settings/types/backup";

const backupData: DulceFlowBackupData = {
  settings: [
    {
      key: "business_name",
      value: "Dulces Maria",
      updated_at: "2026-05-04T10:00:00.000Z",
    },
  ],
  products: [
    {
      id: "product_1",
      name: "Cake",
      price: 10,
      description: null,
      image_uri: null,
      is_active: 1,
      created_at: "2026-05-04T10:00:00.000Z",
      updated_at: "2026-05-04T10:00:00.000Z",
    },
  ],
  supplies: [
    {
      id: "supply_1",
      name: "Sugar",
      unit: "kg",
      default_price: 5,
      is_active: 1,
      created_at: "2026-05-04T10:00:00.000Z",
      updated_at: "2026-05-04T10:00:00.000Z",
    },
  ],
  orders: [
    {
      id: "order_1",
      order_number: "ORD-1",
      customer_name: "Maria",
      customer_phone: null,
      subtotal: 20,
      total: 20,
      status: "pending",
      due_date: "2026-05-05T12:00:00.000Z",
      note: null,
      delivered_at: null,
      cancelled_at: null,
      created_at: "2026-05-04T10:00:00.000Z",
      updated_at: "2026-05-04T10:00:00.000Z",
    },
  ],
  order_items: [
    {
      id: "item_1",
      order_id: "order_1",
      product_id: "product_1",
      product_name: "Cake",
      quantity: 2,
      unit_price: 10,
      subtotal: 20,
      created_at: "2026-05-04T10:00:00.000Z",
    },
  ],
  expenses: [
    {
      id: "expense_1",
      supply_id: "supply_1",
      supply_name: "Sugar",
      quantity: 1,
      unit: "kg",
      unit_price: 5,
      total: 5,
      status: "active",
      note: null,
      created_at: "2026-05-04T10:00:00.000Z",
      updated_at: "2026-05-04T10:00:00.000Z",
    },
  ],
  movements: [
    {
      id: "movement_1",
      type: "income",
      direction: "in",
      source_type: "order",
      source_id: "order_1",
      amount: 20,
      description: "Ingreso por pedido ORD-1",
      status: "active",
      movement_date: "2026-05-04T10:00:00.000Z",
      created_at: "2026-05-04T10:00:00.000Z",
      updated_at: "2026-05-04T10:00:00.000Z",
      reversed_movement_id: null,
    },
  ],
};

describe("BackupRepository", () => {
  it("replaces all rows and exports the restored data", async () => {
    const mock = createMockDatabaseClient();
    const repository = new BackupRepository(mock.client);

    await repository.replaceAllDataAsync({
      ...backupData,
      products: [{ ...backupData.products[0], id: "old_product", name: "Old" }],
      orders: [],
      order_items: [],
      expenses: [],
      movements: [],
    });

    await repository.replaceAllDataAsync(backupData);

    await expect(repository.exportDataAsync()).resolves.toEqual(backupData);
    expect(mock.executedStatements).toContain("PRAGMA defer_foreign_keys = ON;");
  });
});
