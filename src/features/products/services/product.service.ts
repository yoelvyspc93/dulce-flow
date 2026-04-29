import { getDatabaseAsync } from "@/database/connection";
import { ProductRecipeRepository, ProductRepository } from "@/database/repositories";
import { createId } from "@/shared/utils/id";
import type { Product, ProductRecipeItem } from "@/shared/types";

import { productSchema, productWithRecipeSchema, type ProductFormValues, type ProductWithRecipeFormValues } from "../validations/product.schema";

export type ProductDetails = {
  product: Product;
  recipeItems: ProductRecipeItem[];
};

export function calculateRecipeCost(items: Pick<ProductRecipeItem, "quantity" | "unitPrice">[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function suggestSalePrice(cost: number, marginPercent = 30): number {
  if (cost <= 0) {
    return 0;
  }

  return Number((cost * (1 + marginPercent / 100)).toFixed(2));
}

function buildRecipeItems(productId: string, values: ProductWithRecipeFormValues, now: string): ProductRecipeItem[] {
  return values.recipeItems.map((item) => {
    const quantity = item.quantity;
    const unitPrice = item.unitPrice;

    return {
      id: createId("recipe_item"),
      productId,
      supplyId: item.supplyId,
      supplyName: item.supplyName,
      quantity,
      unit: item.unit,
      unitPrice,
      subtotal: quantity * unitPrice,
      createdAt: now,
    };
  });
}

export async function listProductsAsync(): Promise<Product[]> {
  const database = await getDatabaseAsync();
  return new ProductRepository(database).getAllAsync();
}

export async function getProductAsync(id: string): Promise<Product | null> {
  const database = await getDatabaseAsync();
  return new ProductRepository(database).getByIdAsync(id);
}

export async function getProductDetailsAsync(id: string): Promise<ProductDetails | null> {
  const database = await getDatabaseAsync();
  const product = await new ProductRepository(database).getByIdAsync(id);

  if (!product) {
    return null;
  }

  return {
    product,
    recipeItems: await new ProductRecipeRepository(database).getByProductIdAsync(id),
  };
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

export async function createProductWithRecipeAsync(values: ProductWithRecipeFormValues): Promise<ProductDetails> {
  const parsed = productWithRecipeSchema.parse(values);
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
  const recipeItems = buildRecipeItems(product.id, parsed, now);

  const database = await getDatabaseAsync();
  await database.withTransactionAsync(async (transaction) => {
    await new ProductRepository(transaction).createAsync(product);
    await new ProductRecipeRepository(transaction).replaceByProductIdAsync(product.id, recipeItems);
  });

  return { product, recipeItems };
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

export async function updateProductWithRecipeAsync(product: Product, values: ProductWithRecipeFormValues): Promise<ProductDetails> {
  const parsed = productWithRecipeSchema.parse(values);
  const now = new Date().toISOString();
  const updatedProduct: Product = {
    ...product,
    name: parsed.name,
    price: parsed.price,
    description: parsed.description || undefined,
    updatedAt: now,
  };
  const recipeItems = buildRecipeItems(product.id, parsed, now);

  const database = await getDatabaseAsync();
  await database.withTransactionAsync(async (transaction) => {
    await new ProductRepository(transaction).updateAsync(updatedProduct);
    await new ProductRecipeRepository(transaction).replaceByProductIdAsync(product.id, recipeItems);
  });

  return { product: updatedProduct, recipeItems };
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
  await setProductActiveAsync(product, false);
}
