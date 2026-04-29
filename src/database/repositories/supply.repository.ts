import type { DatabaseClient } from "@/database/client";
import type { Supply } from "@/shared/types";

import { fromSqliteBoolean, toSqliteBoolean } from "./helpers";

type SupplyRow = {
  id: string;
  name: string;
  unit: string;
  default_price: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function mapSupplyRow(row: SupplyRow): Supply {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    defaultPrice: row.default_price,
    isActive: fromSqliteBoolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupplyRepository {
  constructor(private readonly client: DatabaseClient) {}

  async getByIdAsync(id: string): Promise<Supply | null> {
    const row = await this.client.getFirstAsync<SupplyRow>("SELECT * FROM supplies WHERE id = ? LIMIT 1;", [id]);
    return row ? mapSupplyRow(row) : null;
  }

  async getAllAsync(): Promise<Supply[]> {
    const rows = await this.client.getAllAsync<SupplyRow>("SELECT * FROM supplies ORDER BY created_at DESC;");
    return rows.map(mapSupplyRow);
  }

  async getActiveAsync(): Promise<Supply[]> {
    const rows = await this.client.getAllAsync<SupplyRow>(
      "SELECT * FROM supplies WHERE is_active = 1 ORDER BY name ASC;"
    );
    return rows.map(mapSupplyRow);
  }

  async createAsync(supply: Supply): Promise<void> {
    await this.client.runAsync(
      `INSERT INTO supplies (
        id, name, unit, default_price, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        supply.id,
        supply.name,
        supply.unit,
        supply.defaultPrice,
        toSqliteBoolean(supply.isActive),
        supply.createdAt,
        supply.updatedAt,
      ]
    );
  }

  async updateAsync(supply: Supply): Promise<void> {
    await this.client.runAsync(
      `UPDATE supplies
       SET name = ?, unit = ?, default_price = ?, is_active = ?, updated_at = ?
       WHERE id = ?;`,
      [
        supply.name,
        supply.unit,
        supply.defaultPrice,
        toSqliteBoolean(supply.isActive),
        supply.updatedAt,
        supply.id,
      ]
    );
  }

  async deleteAsync(id: string): Promise<void> {
    await this.client.runAsync("DELETE FROM supplies WHERE id = ?;", [id]);
  }

  async getUsageCountAsync(id: string): Promise<number> {
    const expenseRow = await this.client.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM expenses WHERE supply_id = ?;",
      [id]
    );
    return expenseRow?.count ?? 0;
  }
}
