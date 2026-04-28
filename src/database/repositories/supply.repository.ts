import type { DatabaseClient } from "@/database/client";
import type { Supply } from "@/shared/types";

import { fromSqliteBoolean, toSqliteBoolean } from "./helpers";

type SupplyRow = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  default_price: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function mapSupplyRow(row: SupplyRow): Supply {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    category: (row.category as Supply["category"]) ?? undefined,
    defaultPrice: row.default_price ?? undefined,
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
        id, name, unit, category, default_price, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        supply.id,
        supply.name,
        supply.unit,
        supply.category ?? null,
        supply.defaultPrice ?? null,
        toSqliteBoolean(supply.isActive),
        supply.createdAt,
        supply.updatedAt,
      ]
    );
  }

  async updateAsync(supply: Supply): Promise<void> {
    await this.client.runAsync(
      `UPDATE supplies
       SET name = ?, unit = ?, category = ?, default_price = ?, is_active = ?, updated_at = ?
       WHERE id = ?;`,
      [
        supply.name,
        supply.unit,
        supply.category ?? null,
        supply.defaultPrice ?? null,
        toSqliteBoolean(supply.isActive),
        supply.updatedAt,
        supply.id,
      ]
    );
  }
}
