"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/reports";

// ─────────────────────────────────────────────────────
//  use-reports.ts
//  React Query hooks for the admin reports module.
//  staleTime is longer here since dashboard stats
//  don't need to refresh every second.
// ─────────────────────────────────────────────────────

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => reportsApi.getDashboard(),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useRevenueReport = (groupBy: "day" | "week" | "month" = "day") => {
  return useQuery({
    queryKey: ["reports", "revenue", groupBy],
    queryFn: () => reportsApi.getRevenueReport({ groupBy }),
    staleTime: 60 * 1000,
  });
};

export const useBoothPerformance = () => {
  return useQuery({
    queryKey: ["reports", "booth-performance"],
    queryFn: () => reportsApi.getBoothPerformance(),
    staleTime: 60 * 1000,
  });
};