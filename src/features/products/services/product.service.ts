import { getDatabaseAsync } from "@/database/connection";
import { ProductRepository } from "@/database/repositories";
import { createId } from "@/shared/utils/id";
import type { Product } from "@/shared/types";

import { productSchema, type ProductFormValues } from "../validations/product.schema";

export async function listProductsAsync(): Promise<Product[]> {
  const database = await getDatabaseAsync();
  return new ProductRepository(database).getAllAsync();
}

export async function getProductAsync(id: string): Promise<Product | null> {
  const database = await getDatabaseAsync();
  return new ProductRepository(database).getByIdAsync(id);
}

export async function createProductAsync(values: ProductFormValues): Promise<Product> {
  const parsed = productSchema.parse(values);
  const now = new Date().toISOString();
  const product: Product = {
    id: createId("product"),
    name: parsed.name,
    price: parsed.price,
    description: parsed.description || undefined,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const database = await getDatabaseAsync();
  await new ProductRepository(database).createAsync(product);

  return product;
}

export async function updateProductAsync(product: Product, values: ProductFormValues): Promise<Product> {
  const parsed = productSchema.parse(values);
  const updatedProduct: Product = {
    ...product,
    name: parsed.name,
    price: parsed.price,
    description: parsed.description || undefined,
    updatedAt: new Date().toISOString(),
  };

  const database = await getDatabaseAsync();
  await new ProductRepository(database).updateAsync(updatedProduct);

  return updatedProduct;
}

export async function setProductActiveAsync(product: Product, isActive: boolean): Promise<Product> {
  const updatedProduct: Product = {
    ...product,
    isActive,
    updatedAt: new Date().toISOString(),
  };

  const database = await getDatabaseAsync();
  await new ProductRepository(database).updateAsync(updatedProduct);

  return updatedProduct;
}
