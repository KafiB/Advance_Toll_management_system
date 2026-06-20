import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  auth-store.ts
//  Global state for the logged-in user.
//
//  Why Zustand?
//  Any component anywhere in the app can read
//  "who is logged in" and "what role they have"
//  without passing props down through every layer.
//
//  persist middleware automatically saves this to
//  localStorage — so refreshing the page doesn't
//  log the user out.
// ─────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
        set({ user, token, isAuthenticated: true });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({ user: { ...currentUser, ...updates } });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: "tms-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        hasHydrated: state.hasHydrated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// ─────────────────────────────────────────────────────
//  HELPER HOOKS
//  Convenient shortcuts used throughout the app
// ─────────────────────────────────────────────────────

// Get current user's role — used for RBAC checks
export const useUserRole = () => useAuthStore((state) => state.user?.role);

// Check if current user has one of the allowed roles
export const useHasRole = (...roles: string[]) => {
  const role = useUserRole();
  return role ? roles.includes(role) : false;
};