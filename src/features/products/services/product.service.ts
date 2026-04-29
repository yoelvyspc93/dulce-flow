import { getDatabaseAsync } from "@/database/connection";
import { ProductRepository } from "@/database/repositories";
import { createId } from "@/shared/utils/id";
import type { Product } from "@/shared/types";

import { productSchema, type ProductFormValues } from "../validations/product.schema";

function normalizeProductName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

async function assertUniqueProductNameAsync(repository: ProductRepository, name: string, currentProductId?: string): Promise<void> {
  const normalizedName = normalizeProductName(name);
  const products = await repository.getAllAsync();
  const duplicatedProduct = products.find(
    (product) => product.id !== currentProductId && normalizeProductName(product.name) === normalizedName
  );

  if (duplicatedProduct) {
    throw new Error("PRODUCT_NAME_DUPLICATED");
  }
}

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
  const database = await getDatabaseAsync();
  const repository = new ProductRepository(database);

  await assertUniqueProductNameAsync(repository, parsed.name);

  const product: Product = {
    id: createId("product"),
    name: parsed.name,
    price: parsed.price,
    description: parsed.description || undefined,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await repository.createAsync(product);

  return product;
}

export async function updateProductAsync(product: Product, values: ProductFormValues): Promise<Product> {
  const parsed = productSchema.parse(values);
  const database = await getDatabaseAsync();
  const repository = new ProductRepository(database);

  await assertUniqueProductNameAsync(repository, parsed.name, product.id);

  const updatedProduct: Product = {
    ...product,
    name: parsed.name,
    price: parsed.price,
    description: parsed.description || undefined,
    updatedAt: new Date().toISOString(),
  };

  await repository.updateAsync(updatedProduct);

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

export async function getProductUsageCountAsync(productId: string): Promise<number> {
  const database = await getDatabaseAsync();
  return new ProductRepository(database).getUsageCountAsync(productId);
}

export async function deleteProductPermanentlyAsync(product: Product): Promise<void> {
  const database = await getDatabaseAsync();
  const repository = new ProductRepository(database);
  const usageCount = await repository.getUsageCountAsync(product.id);

  if (usageCount > 0) {
    throw new Error("PRODUCT_HAS_HISTORY");
  }

  await repository.deleteAsync(product.id);
}
