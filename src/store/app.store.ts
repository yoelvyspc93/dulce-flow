import { create } from "zustand";

import type { BusinessSettings } from "@/shared/types";

type BootstrapStatus = "idle" | "loading" | "ready" | "error";

export type AppStoreState = {
  bootstrapStatus: BootstrapStatus;
  hasCompletedOnboarding: boolean;
  businessSettings: BusinessSettings | null;
  setBootstrapLoading: () => void;
  setBootstrapReady: (businessSettings: BusinessSettings | null) => void;
  setBootstrapError: () => void;
  updateBusinessSettings: (businessSettings: BusinessSettings) => void;
};

export const useAppStore = create<AppStoreState>((set) => ({
  bootstrapStatus: "idle",
  hasCompletedOnboarding: false,
  businessSettings: null,
  setBootstrapLoading: () => {
    set({ bootstrapStatus: "loading" });
  },
  setBootstrapReady: (businessSettings) => {
    set({
      bootstrapStatus: "ready",
      hasCompletedOnboarding: businessSettings !== null,
      businessSettings,
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
}));
