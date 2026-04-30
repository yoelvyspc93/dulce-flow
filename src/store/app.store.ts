import { create } from "zustand";

import type { AccessibilitySettings, BusinessSettings } from "@/shared/types";

type BootstrapStatus = "idle" | "loading" | "ready" | "error";

export type AppStoreState = {
  bootstrapStatus: BootstrapStatus;
  hasCompletedOnboarding: boolean;
  businessSettings: BusinessSettings | null;
  accessibilitySettings: AccessibilitySettings;
  setBootstrapLoading: () => void;
  setBootstrapReady: (businessSettings: BusinessSettings | null, accessibilitySettings?: AccessibilitySettings) => void;
  setBootstrapError: () => void;
  updateBusinessSettings: (businessSettings: BusinessSettings) => void;
  updateAccessibilitySettings: (accessibilitySettings: AccessibilitySettings) => void;
};

export const defaultAccessibilitySettings: AccessibilitySettings = {
  fontScale: 1,
};

export const useAppStore = create<AppStoreState>((set) => ({
  bootstrapStatus: "idle",
  hasCompletedOnboarding: false,
  businessSettings: null,
  accessibilitySettings: defaultAccessibilitySettings,
  setBootstrapLoading: () => {
    set({ bootstrapStatus: "loading" });
  },
  setBootstrapReady: (businessSettings, accessibilitySettings = defaultAccessibilitySettings) => {
    set({
      bootstrapStatus: "ready",
      hasCompletedOnboarding: businessSettings !== null,
      businessSettings,
      accessibilitySettings,
    });
  },
  setBootstrapError: () => {
    set({
      bootstrapStatus: "error",
      hasCompletedOnboarding: false,
    });
  },
  updateBusinessSettings: (businessSettings) => {
    set({
      bootstrapStatus: "ready",
      hasCompletedOnboarding: true,
      businessSettings,
    });
  },
  updateAccessibilitySettings: (accessibilitySettings) => {
    set({ accessibilitySettings });
  },
}));
