import type { DatabaseClient } from "@/database/client";
import type { Product, ProductRecipeItem } from "@/shared/types";

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

type ProductRecipeItemRow = {
  id: string;
  product_id: string;
  supply_id: string | null;
  supply_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  created_at: string;
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

function mapProductRecipeItemRow(row: ProductRecipeItemRow): ProductRecipeItem {
  return {
    id: row.id,
    productId: row.product_id,
    supplyId: row.supply_id ?? undefined,
    supplyName: row.supply_name,
    quantity: row.quantity,
    unit: row.unit,
    unitPrice: row.unit_price,
    subtotal: row.subtotal,
    createdAt: row.created_at,
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

  async deleteAsync(id: string): Promise<void> {
    await this.client.runAsync("DELETE FROM products WHERE id = ?;", [id]);
  }

  async getUsageCountAsync(id: string): Promise<number> {
    const row = await this.client.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?;",
      [id]
    );
    return row?.count ?? 0;
  }
}

export class ProductRecipeRepository {
  constructor(private readonly client: DatabaseClient) {}

  async getByProductIdAsync(productId: string): Promise<ProductRecipeItem[]> {
    const rows = await this.client.getAllAsync<ProductRecipeItemRow>(
      "SELECT * FROM product_recipe_items WHERE product_id = ? ORDER BY created_at ASC;",
      [productId]
    );
    return rows.map(mapProductRecipeItemRow);
  }

  async replaceByProductIdAsync(productId: string, items: ProductRecipeItem[]): Promise<void> {
    await this.client.runAsync("DELETE FROM product_recipe_items WHERE product_id = ?;", [productId]);

    for (const item of items) {
      await this.client.runAsync(
        `INSERT INTO product_recipe_items (
          id, product_id, supply_id, supply_name, quantity, unit, unit_price, subtotal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          item.id,
          item.productId,
          item.supplyId ?? null,
          item.supplyName,
          item.quantity,
          item.unit,
          item.unitPrice,
          item.subtotal,
          item.createdAt,
        ]
      );
    }
  }
}
