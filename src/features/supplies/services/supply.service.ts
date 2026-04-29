import { getDatabaseAsync } from "@/database/connection";
import { SupplyRepository } from "@/database/repositories";
import { createId } from "@/shared/utils/id";
import type { Supply } from "@/shared/types";

import { supplySchema, type SupplyFormValues } from "../validations/supply.schema";

function normalizeSupplyName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

async function assertUniqueSupplyNameAsync(repository: SupplyRepository, name: string, currentSupplyId?: string): Promise<void> {
  const normalizedName = normalizeSupplyName(name);
  const supplies = await repository.getAllAsync();
  const duplicatedSupply = supplies.find(
    (supply) => supply.id !== currentSupplyId && normalizeSupplyName(supply.name) === normalizedName
  );

  if (duplicatedSupply) {
    throw new Error("SUPPLY_NAME_DUPLICATED");
  }
}

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
  const database = await getDatabaseAsync();
  const repository = new SupplyRepository(database);

  await assertUniqueSupplyNameAsync(repository, parsed.name);

  const supply: Supply = {
    id: createId("supply"),
    name: parsed.name,
    unit: parsed.unit,
    defaultPrice: parsed.defaultPrice,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await repository.createAsync(supply);

  return supply;
}

export async function updateSupplyAsync(supply: Supply, values: SupplyFormValues): Promise<Supply> {
  const parsed = supplySchema.parse(values);
  const database = await getDatabaseAsync();
  const repository = new SupplyRepository(database);

  await assertUniqueSupplyNameAsync(repository, parsed.name, supply.id);

  const updatedSupply: Supply = {
    ...supply,
    name: parsed.name,
    unit: parsed.unit,
    defaultPrice: parsed.defaultPrice,
    updatedAt: new Date().toISOString(),
  };

  await repository.updateAsync(updatedSupply);

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
  const database = await getDatabaseAsync();
  const repository = new SupplyRepository(database);
  const usageCount = await repository.getUsageCountAsync(supply.id);

  if (usageCount > 0) {
    throw new Error("SUPPLY_HAS_HISTORY");
  }

  await repository.deleteAsync(supply.id);
}
