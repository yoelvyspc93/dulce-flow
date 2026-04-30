import { Platform } from "react-native";

import { defaultAccessibilitySettings } from "@/store/app.store";

import {
  loadAccessibilitySettingsAsync,
  loadBusinessSettingsAsync,
  saveAccessibilitySettingsAsync,
  saveBusinessSettingsAsync,
} from "./settings.service";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

function setPlatformOS(os: string): void {
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });
}

describe("settings service", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    setPlatformOS("web");
  });

  it("loads null business settings when required web fields are missing", async () => {
    await expect(loadBusinessSettingsAsync()).resolves.toBeNull();
  });

  it("saves, loads and clears optional web business settings", async () => {
    await saveBusinessSettingsAsync({
      businessName: "Dulces Maria",
      currency: "USD",
      avatarId: "chef",
      phone: "555",
      address: "Centro",
    });
    await expect(loadBusinessSettingsAsync()).resolves.toEqual({
      businessName: "Dulces Maria",
      currency: "CUP",
      avatarId: "chef",
      phone: "555",
      address: "Centro",
    });

    await saveBusinessSettingsAsync({ businessName: "Dulces Maria", currency: "CUP" });
    await expect(loadBusinessSettingsAsync()).resolves.toEqual({
      businessName: "Dulces Maria",
      currency: "CUP",
      avatarId: undefined,
      phone: undefined,
      address: undefined,
    });
  });

  it("loads web business settings with fixed currency when legacy storage has no currency", async () => {
    storage.setItem("dulceflow.business_name", "Dulces Maria");

    await expect(loadBusinessSettingsAsync()).resolves.toEqual({
      businessName: "Dulces Maria",
      currency: "CUP",
      avatarId: undefined,
      phone: undefined,
      address: undefined,
    });
  });

  it("loads default web accessibility settings for invalid storage values", async () => {
    storage.setItem("dulceflow.font_scale", "0");

    await expect(loadAccessibilitySettingsAsync()).resolves.toEqual({
      fontScale: defaultAccessibilitySettings.fontScale,
    });
  });

  it("normalizes and stores web accessibility settings", async () => {
    await expect(saveAccessibilitySettingsAsync({ fontScale: 2 })).resolves.toEqual({
      fontScale: 1.35,
    });
    await expect(loadAccessibilitySettingsAsync()).resolves.toEqual({
      fontScale: 1.35,
    });

    await expect(saveAccessibilitySettingsAsync({ fontScale: 0.5 })).resolves.toEqual({
      fontScale: 1,
    });
  });
});
