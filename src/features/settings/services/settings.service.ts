import { getDatabaseAsync } from "@/database/connection";
import { SettingsRepository } from "@/database/repositories";
import type { BusinessSettings } from "@/shared/types";

export async function loadBusinessSettingsAsync(): Promise<BusinessSettings | null> {
  const database = await getDatabaseAsync();
  const repository = new SettingsRepository(database);
  return repository.getBusinessSettingsAsync();
}

export async function saveBusinessSettingsAsync(settings: BusinessSettings): Promise<BusinessSettings> {
  const database = await getDatabaseAsync();
  const repository = new SettingsRepository(database);
  const updatedAt = new Date().toISOString();

  await repository.saveBusinessSettingsAsync(settings, updatedAt);

  return settings;
}
