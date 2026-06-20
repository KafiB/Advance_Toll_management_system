"use client";

import { useQuery } from "@tanstack/react-query";
import { boothsApi } from "@/lib/api/booths";

// ─────────────────────────────────────────────────────
//  use-booths.ts
//  React Query hooks for booth data.
// ─────────────────────────────────────────────────────

export const useBooths = (params?: Record<string, string | number | boolean>) => {
  return useQuery({
    queryKey: ["booths", params],
    queryFn: () => boothsApi.getAll(params),
    staleTime: 60 * 1000,
  });
};

export const useBooth = (id: string | undefined) => {
  return useQuery({
    queryKey: ["booths", id],
    queryFn: () => boothsApi.getById(id as string),
    enabled: !!id,
  });
};