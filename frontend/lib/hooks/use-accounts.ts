"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { accountsApi } from "@/lib/api/accounts";

// ─────────────────────────────────────────────────────
//  use-accounts.ts
//  React Query hooks for the wallet/account module.
// ─────────────────────────────────────────────────────

export const useMyAccount = () => {
  return useQuery({
    queryKey: ["accounts", "my-account"],
    queryFn: () => accountsApi.getMyAccount(),
    retry: false, // don't retry if account doesn't exist (404)
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      toast.success("Account created successfully");
      queryClient.invalidateQueries({ queryKey: ["accounts", "my-account"] });
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to create account", { description: error.message });
    },
  });
};

export const useTopUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountsApi.topUp,
    onSuccess: (response) => {
      const data = response.data as { newBalance?: number };
      toast.success("Top-up successful", {
        description: data?.newBalance !== undefined
          ? `New balance: ${data.newBalance} BDT`
          : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["accounts", "my-account"] });
    },
    onError: (error: { message: string }) => {
      toast.error("Top-up failed", { description: error.message });
    },
  });
};