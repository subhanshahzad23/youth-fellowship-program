"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Per-viewer interface conveniences (not product data): admin cohort filter,
 * guided walkthrough position, collapsed hints. Safe to lose.
 */
interface UIState {
  adminCohortFilter: string; // "all" or cohort id
  walkthroughOpen: boolean;
  walkthroughStep: number;
  demoPanelOpen: boolean;
  setAdminCohortFilter: (id: string) => void;
  setWalkthrough: (open: boolean, step?: number) => void;
  setDemoPanelOpen: (v: boolean) => void;
}

const safe = createJSONStorage(() => {
  try {
    return window.localStorage;
  } catch {
    return undefined as unknown as Storage;
  }
});

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      adminCohortFilter: "all",
      walkthroughOpen: false,
      walkthroughStep: 0,
      demoPanelOpen: false,
      setAdminCohortFilter: (id) => set({ adminCohortFilter: id }),
      setWalkthrough: (open, step) => set((s) => ({ walkthroughOpen: open, walkthroughStep: step ?? s.walkthroughStep })),
      setDemoPanelOpen: (v) => set({ demoPanelOpen: v }),
    }),
    { name: "launchpad-ui", storage: safe, skipHydration: true, partialize: (s) => ({ adminCohortFilter: s.adminCohortFilter, walkthroughOpen: s.walkthroughOpen, walkthroughStep: s.walkthroughStep }) },
  ),
);
