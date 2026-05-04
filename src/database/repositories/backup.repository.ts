import type { DatabaseClient } from "@/database/client";
import type {
  BackupExpenseRow,
  BackupMovementRow,
  BackupOrderItemRow,
  BackupOrderRow,
  BackupProductRow,
  BackupSettingRow,
  BackupSupplyRow,
  DulceFlowBackupData,
} from "@/features/settings/types/backup";

export class BackupRepository {
  constructor(private readonly client: DatabaseClient) {}

  async exportDataAsync(): Promise<DulceFlowBackupData> {
    const settings = await this.client.getAllAsync<BackupSettingRow>("SELECT * FROM settings ORDER BY key ASC;");
    const products = await this.client.getAllAsync<BackupProductRow>("SELECT * FROM products ORDER BY created_at ASC;");
    const supplies = await this.client.getAllAsync<BackupSupplyRow>("SELECT * FROM supplies ORDER BY created_at ASC;");
    const orders = await this.client.getAllAsync<BackupOrderRow>("SELECT * FROM orders ORDER BY created_at ASC;");
    const orderItems = await this.client.getAllAsync<BackupOrderItemRow>(
      "SELECT * FROM order_items ORDER BY created_at ASC;"
    );
    const expenses = await this.client.getAllAsync<BackupExpenseRow>("SELECT * FROM expenses ORDER BY created_at ASC;");
    const movements = await this.client.getAllAsync<BackupMovementRow>(
      "SELECT * FROM movements ORDER BY created_at ASC;"
    );

    return {
      products,
      supplies,
      orders,
      order_items: orderItems,
      expenses,
      movements,
      settings,
    };
  }

  async replaceAllDataAsync(data: DulceFlowBackupData): Promise<void> {
    await this.client.withTransactionAsync(async (transaction) => {
      await transaction.execAsync("PRAGMA defer_foreign_keys = ON;");

      await transaction.runAsync("DELETE FROM movements;");
      await transaction.runAsync("DELETE FROM order_items;");
      await transaction.runAsync("DELETE FROM expenses;");
      await transaction.runAsync("DELETE FROM orders;");
      await transaction.runAsync("DELETE FROM products;");
      await transaction.runAsync("DELETE FROM supplies;");
      await transaction.runAsync("DELETE FROM settings;");

      for (const setting of data.settings) {
        await transaction.runAsync(
          "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?);",
          [setting.key, setting.value, setting.updated_at]
        );
      }

      for (const product of data.products) {
        await transaction.runAsync(
          `INSERT INTO products (
            id, name, price, description, image_uri, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            product.id,
            product.name,
            product.price,
            product.description,
            product.image_uri,
            product.is_active,
            product.created_at,
            product.updated_at,
          ]
        );
      }

      for (const supply of data.supplies) {
        await transaction.runAsync(
          `INSERT INTO supplies (
            id, name, unit, default_price, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            supply.id,
            supply.name,
            supply.unit,
            supply.default_price,
            supply.is_active,
            supply.created_at,
            supply.updated_at,
          ]
        );
      }

      for (const order of data.orders) {
        await transaction.runAsync(
          `INSERT INTO orders (
            id, order_number, customer_name, customer_phone, subtotal, total, status,
            due_date, note, delivered_at, cancelled_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            order.id,
            order.order_number,
            order.customer_name,
            order.customer_phone,
            order.subtotal,
            order.total,
            order.status,
            order.due_date,
            order.note,
            order.delivered_at,
            order.cancelled_at,
            order.created_at,
            order.updated_at,
          ]
        );
      }

      for (const item of data.order_items) {
        await transaction.runAsync(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, unit_price, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.order_id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.subtotal,
            item.created_at,
          ]
        );
      }

      for (const expense of data.expenses) {
        await transaction.runAsync(
          `INSERT INTO expenses (
            id, supply_id, supply_name, quantity, unit, unit_price, total, status, note, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            expense.id,
            expense.supply_id,
            expense.supply_name,
            expense.quantity,
            expense.unit,
            expense.unit_price,
            expense.total,
            expense.status,
            expense.note,
            expense.created_at,
            expense.updated_at,
          ]
        );
      }

      for (const movement of data.movements) {
        await transaction.runAsync(
          `INSERT INTO movements (
            id, type, direction, source_type, source_id, amount, description,
            status, movement_date, created_at, updated_at, reversed_movement_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            movement.id,
            movement.type,
            movement.direction,
            movement.source_type,
            movement.source_id,
            movement.amount,
            movement.description,
            movement.status,
            movement.movement_date,
            movement.created_at,
            movement.updated_at,
            movement.reversed_movement_id,
          ]
        );
      }
    });
  }
}
