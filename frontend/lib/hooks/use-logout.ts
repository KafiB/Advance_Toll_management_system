"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";

// ─────────────────────────────────────────────────────
//  use-logout.ts
//  Calls backend logout (clears cookie), clears
//  Zustand auth state, and redirects to login.
// ─────────────────────────────────────────────────────

export const useLogout = () => {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      toast.success("Logged out successfully");
      router.push("/login");
    },
    onError: () => {
      // Even if API call fails, clear local state anyway
      clearAuth();
      router.push("/login");
    },
  });
};