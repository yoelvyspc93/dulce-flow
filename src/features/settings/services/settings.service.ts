import { Platform } from "react-native";

import type { AccessibilitySettings, BusinessSettings } from "@/shared/types";
import { defaultAccessibilitySettings } from "@/store/app.store";

const WEB_BUSINESS_NAME_KEY = "dulceflow.business_name";
const WEB_CURRENCY_KEY = "dulceflow.currency";
const WEB_AVATAR_ID_KEY = "dulceflow.avatar_id";
const WEB_PHONE_KEY = "dulceflow.phone";
const WEB_ADDRESS_KEY = "dulceflow.address";
const WEB_FONT_SCALE_KEY = "dulceflow.font_scale";
const WEB_HIGH_CONTRAST_KEY = "dulceflow.high_contrast_enabled";

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

async function loadNativeAccessibilitySettingsAsync(): Promise<AccessibilitySettings> {
  const { getDatabaseAsync } = await import("@/database/connection");
  const { SettingsRepository } = await import("@/database/repositories");
  const database = await getDatabaseAsync();
  const settings = await new SettingsRepository(database).getAccessibilitySettingsAsync();
  return settings ?? defaultAccessibilitySettings;
}

async function saveNativeAccessibilitySettingsAsync(settings: AccessibilitySettings): Promise<AccessibilitySettings> {
  const { getDatabaseAsync } = await import("@/database/connection");
  const { SettingsRepository } = await import("@/database/repositories");
  const database = await getDatabaseAsync();
  await new SettingsRepository(database).saveAccessibilitySettingsAsync(settings, new Date().toISOString());
  return settings;
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

export async function loadAppSettingsAsync(): Promise<{
  businessSettings: BusinessSettings | null;
  accessibilitySettings: AccessibilitySettings;
}> {
  const businessSettings = await loadBusinessSettingsAsync();
  const accessibilitySettings = await loadAccessibilitySettingsAsync();

  return { businessSettings, accessibilitySettings };
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
    avatarId: storage?.getItem(WEB_AVATAR_ID_KEY) ?? undefined,
    phone: storage?.getItem(WEB_PHONE_KEY) ?? undefined,
    address: storage?.getItem(WEB_ADDRESS_KEY) ?? undefined,
  };
}

export async function loadAccessibilitySettingsAsync(): Promise<AccessibilitySettings> {
  if (Platform.OS !== "web") {
    return loadNativeAccessibilitySettingsAsync();
  }

  const storage = getWebStorage();
  const fontScale = Number(storage?.getItem(WEB_FONT_SCALE_KEY));

  return {
    fontScale: Number.isFinite(fontScale) && fontScale > 0 ? fontScale : defaultAccessibilitySettings.fontScale,
    highContrastEnabled: storage?.getItem(WEB_HIGH_CONTRAST_KEY) === "true",
  };
}

export async function saveBusinessSettingsAsync(settings: BusinessSettings): Promise<BusinessSettings> {
  if (Platform.OS !== "web") {
    return saveNativeBusinessSettingsAsync(settings);
  }

  const storage = getWebStorage();
  storage?.setItem(WEB_BUSINESS_NAME_KEY, settings.businessName);
  storage?.setItem(WEB_CURRENCY_KEY, settings.currency);

  if (settings.avatarId) {
    storage?.setItem(WEB_AVATAR_ID_KEY, settings.avatarId);
  } else {
    storage?.removeItem(WEB_AVATAR_ID_KEY);
  }

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

export async function saveAccessibilitySettingsAsync(settings: AccessibilitySettings): Promise<AccessibilitySettings> {
  const normalized: AccessibilitySettings = {
    fontScale: Math.min(1.35, Math.max(1, settings.fontScale)),
    highContrastEnabled: settings.highContrastEnabled,
  };

  if (Platform.OS !== "web") {
    return saveNativeAccessibilitySettingsAsync(normalized);
  }

  const storage = getWebStorage();
  storage?.setItem(WEB_FONT_SCALE_KEY, String(normalized.fontScale));
  storage?.setItem(WEB_HIGH_CONTRAST_KEY, normalized.highContrastEnabled ? "true" : "false");

  return normalized;
}
