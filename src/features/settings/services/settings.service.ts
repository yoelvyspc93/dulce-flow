import { Platform } from "react-native";

import type { BusinessSettings } from "@/shared/types";

const WEB_BUSINESS_NAME_KEY = "dulceflow.business_name";
const WEB_CURRENCY_KEY = "dulceflow.currency";
const WEB_PHONE_KEY = "dulceflow.phone";
const WEB_ADDRESS_KEY = "dulceflow.address";

function getWebStorage(): Storage | null {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

async function loadNativeBusinessSettingsAsync(): Promise<BusinessSettings | null> {
  const { getDatabaseAsync } = await import("@/database/connection");
  const { SettingsRepository } = await import("@/database/repositories");
  const database = await getDatabaseAsync();
  const repository = new SettingsRepository(database);
  return repository.getBusinessSettingsAsync();
}

async function saveNativeBusinessSettingsAsync(settings: BusinessSettings): Promise<BusinessSettings> {
  const { getDatabaseAsync } = await import("@/database/connection");
  const { SettingsRepository } = await import("@/database/repositories");
  const database = await getDatabaseAsync();
  const repository = new SettingsRepository(database);
  const updatedAt = new Date().toISOString();

  await repository.saveBusinessSettingsAsync(settings, updatedAt);

  return settings;
}

export async function loadBusinessSettingsAsync(): Promise<BusinessSettings | null> {
  if (Platform.OS !== "web") {
    return loadNativeBusinessSettingsAsync();
  }

  const storage = getWebStorage();
  const businessName = storage?.getItem(WEB_BUSINESS_NAME_KEY) ?? null;
  const currency = storage?.getItem(WEB_CURRENCY_KEY) ?? null;

  if (!businessName || !currency) {
    return null;
  }

  return {
    businessName,
    currency,
    phone: storage?.getItem(WEB_PHONE_KEY) ?? undefined,
    address: storage?.getItem(WEB_ADDRESS_KEY) ?? undefined,
  };
}

export async function saveBusinessSettingsAsync(settings: BusinessSettings): Promise<BusinessSettings> {
  if (Platform.OS !== "web") {
    return saveNativeBusinessSettingsAsync(settings);
  }

  const storage = getWebStorage();
  storage?.setItem(WEB_BUSINESS_NAME_KEY, settings.businessName);
  storage?.setItem(WEB_CURRENCY_KEY, settings.currency);

  if (settings.phone) {
    storage?.setItem(WEB_PHONE_KEY, settings.phone);
  } else {
    storage?.removeItem(WEB_PHONE_KEY);
  }

  if (settings.address) {
    storage?.setItem(WEB_ADDRESS_KEY, settings.address);
  } else {
    storage?.removeItem(WEB_ADDRESS_KEY);
  }

  return settings;
}
