"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { LoginPayload, RegisterPayload } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  use-auth.ts
//  Reusable hooks wrapping React Query mutations
//  for login and register. Handles:
//  - Calling the API
//  - Saving auth state to Zustand
//  - Redirecting to the right dashboard
//  - Showing toast notifications
// ─────────────────────────────────────────────────────

// ── Maps user role to their dashboard route ───────────
const getDashboardRoute = (role: string) => {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "operator":
      return "/dashboard/operator";
    default:
      return "/dashboard/user";
  }
};

export const useLogin = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (response) => {
      if (!response.data) return;

      const { user, token } = response.data;
      setAuth(user, token);

      toast.success("Welcome back!", {
        description: `Logged in as ${user.name}`,
      });

      router.push(getDashboardRoute(user.role));
    },
    onError: (error: { message: string }) => {
      toast.error("Login failed", {
        description: error.message,
      });
    },
  });
};

export const useRegister = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (response) => {
      if (!response.data) return;

      const { user, token } = response.data;
      setAuth(user, token);

      toast.success("Account created!", {
        description: "Please check your email to verify your account.",
      });

      router.push(getDashboardRoute(user.role));
    },
    onError: (error: { message: string }) => {
      toast.error("Registration failed", {
        description: error.message,
      });
    },
  });
};