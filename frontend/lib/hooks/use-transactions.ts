"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transactionsApi } from "@/lib/api/transactions";

// ─────────────────────────────────────────────────────
//  use-transactions.ts
//  React Query hooks for transaction data + processing.
// ─────────────────────────────────────────────────────

export const useMyTransactions = (params?: Record<string, string | number>) => {
  return useQuery({
    queryKey: ["transactions", "my", params],
    queryFn: () => transactionsApi.getMyTransactions(params),
  });
};

export const useAllTransactions = (params?: Record<string, string | number>) => {
  return useQuery({
    queryKey: ["transactions", "all", params],
    queryFn: () => transactionsApi.getAll(params),
  });
};

export const useBoothTransactions = (
  boothId: string | undefined,
  params?: Record<string, string | number>
) => {
  return useQuery({
    queryKey: ["transactions", "booth", boothId, params],
    queryFn: () => transactionsApi.getBoothTransactions(boothId as string, params),
    enabled: !!boothId,
  });
};

export const useProcessToll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.processToll,
    onSuccess: (response) => {
      toast.success("Toll processed successfully", {
        description: `Reference: ${(response.data as { transactionRef?: string })?.transactionRef ?? ""}`,
      });
      // Refresh related data
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["booths"] });
    },
    onError: (error: { message: string }) => {
      toast.error("Toll processing failed", {
        description: error.message,
      });
    },
  });
};