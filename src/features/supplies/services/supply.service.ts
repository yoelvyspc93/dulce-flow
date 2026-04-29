import { getDatabaseAsync } from "@/database/connection";
import { SupplyRepository } from "@/database/repositories";
import { createId } from "@/shared/utils/id";
import type { Supply } from "@/shared/types";

import { supplySchema, type SupplyFormValues } from "../validations/supply.schema";

export async function listSuppliesAsync(): Promise<Supply[]> {
  const database = await getDatabaseAsync();
  return new SupplyRepository(database).getAllAsync();
}

export async function getSupplyAsync(id: string): Promise<Supply | null> {
  const database = await getDatabaseAsync();
  return new SupplyRepository(database).getByIdAsync(id);
}

export async function createSupplyAsync(values: SupplyFormValues): Promise<Supply> {
  const parsed = supplySchema.parse(values);
  const now = new Date().toISOString();
  const supply: Supply = {
    id: createId("supply"),
    name: parsed.name,
    unit: parsed.unit,
    defaultPrice: parsed.defaultPrice,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const database = await getDatabaseAsync();
  await new SupplyRepository(database).createAsync(supply);

  return supply;
}

export async function updateSupplyAsync(supply: Supply, values: SupplyFormValues): Promise<Supply> {
  const parsed = supplySchema.parse(values);
  const updatedSupply: Supply = {
    ...supply,
    name: parsed.name,
    unit: parsed.unit,
    category: undefined,
    defaultPrice: parsed.defaultPrice,
    updatedAt: new Date().toISOString(),
  };

  const database = await getDatabaseAsync();
  await new SupplyRepository(database).updateAsync(updatedSupply);

  return updatedSupply;
}

export async function setSupplyActiveAsync(supply: Supply, isActive: boolean): Promise<Supply> {
  const updatedSupply: Supply = {
    ...supply,
    isActive,
    updatedAt: new Date().toISOString(),
  };

  const database = await getDatabaseAsync();
  await new SupplyRepository(database).updateAsync(updatedSupply);

  return updatedSupply;
}

export async function getSupplyUsageCountAsync(supplyId: string): Promise<number> {
  const database = await getDatabaseAsync();
  return new SupplyRepository(database).getUsageCountAsync(supplyId);
}

export async function deleteSupplyPermanentlyAsync(supply: Supply): Promise<void> {
  await setSupplyActiveAsync(supply, false);
}
