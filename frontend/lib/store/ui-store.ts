import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────────────
//  ui-store.ts
//  Tiny store for UI preferences — currently just
//  whether the sidebar is collapsed. Persisted so
//  it stays collapsed after page refresh.
// ─────────────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "tms-ui",
    }
  )
);