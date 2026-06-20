import api from "./axios";
import { ApiSuccessResponse } from "./types";

// ─────────────────────────────────────────────────────
//  reports.ts
//  API calls for admin analytics/reports module.
// ─────────────────────────────────────────────────────

export interface DashboardSummary {
  today: { revenue: number; count: number };
  thisWeek: { revenue: number; count: number };
  thisMonth: { revenue: number; count: number };
  allTime: { revenue: number; count: number };
  overview: {
    totalUsers: number;
    totalVehicles: number;
    activeBooths: number;
    activeBlacklists: number;
  };
}

export interface RevenueReportPoint {
  date: string;
  revenue: number;
  transactions: number;
}

export interface RevenueReport {
  dateRange: { start: string; end: string };
  groupBy: string;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averagePerTransaction: number;
  };
  data: RevenueReportPoint[];
}

export interface BoothPerformanceItem {
  boothId: string;
  boothName: string;
  boothCode: string;
  status: string;
  revenue: number;
  transactions: number;
  averageToll: number;
  revenueShare: number;
}

export interface BoothPerformance {
  totalRevenue: number;
  totalBooths: number;
  booths: BoothPerformanceItem[];
}

export const reportsApi = {
  getDashboard: async () => {
    const { data } = await api.get<ApiSuccessResponse<DashboardSummary>>(
      "/reports/dashboard"
    );
    return data;
  },

  getRevenueReport: async (params?: { startDate?: string; endDate?: string; groupBy?: string }) => {
    const { data } = await api.get<ApiSuccessResponse<RevenueReport>>(
      "/reports/revenue",
      { params }
    );
    return data;
  },

  getBoothPerformance: async () => {
    const { data } = await api.get<ApiSuccessResponse<BoothPerformance>>(
      "/reports/booth-performance"
    );
    return data;
  },
};