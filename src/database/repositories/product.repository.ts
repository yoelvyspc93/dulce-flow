import type { DatabaseClient } from "@/database/client";
import type { Product } from "@/shared/types";

import { fromSqliteBoolean, toSqliteBoolean } from "./helpers";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_uri: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type ProductInput = Omit<Product, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
};

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description ?? undefined,
    imageUri: row.image_uri ?? undefined,
    isActive: fromSqliteBoolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProductRepository {
  constructor(private readonly client: DatabaseClient) {}

  async getByIdAsync(id: string): Promise<Product | null> {
    const row = await this.client.getFirstAsync<ProductRow>("SELECT * FROM products WHERE id = ? LIMIT 1;", [id]);
    return row ? mapProductRow(row) : null;
  }

  async getAllAsync(): Promise<Product[]> {
    const rows = await this.client.getAllAsync<ProductRow>("SELECT * FROM products ORDER BY created_at DESC;");
    return rows.map(mapProductRow);
  }

  async getActiveAsync(): Promise<Product[]> {
    const rows = await this.client.getAllAsync<ProductRow>(
      "SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC;"
    );
    return rows.map(mapProductRow);
  }

  async createAsync(input: ProductInput): Promise<void> {
    const now = input.createdAt ?? new Date().toISOString();
    const updatedAt = input.updatedAt ?? now;

    await this.client.runAsync(
      `INSERT INTO products (
        id, name, price, description, image_uri, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        input.id,
        input.name,
        input.price,
        input.description ?? null,
        input.imageUri ?? null,
        toSqliteBoolean(input.isActive),
        now,
        updatedAt,
      ]
    );
  }

  async updateAsync(product: Product): Promise<void> {
    await this.client.runAsync(
      `UPDATE products
       SET name = ?, price = ?, description = ?, image_uri = ?, is_active = ?, updated_at = ?
       WHERE id = ?;`,
      [
        product.name,
        product.price,
        product.description ?? null,
        product.imageUri ?? null,
        toSqliteBoolean(product.isActive),
        product.updatedAt,
        product.id,
      ]
    );
  }
}
