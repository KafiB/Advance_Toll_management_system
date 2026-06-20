import api from "./axios";
import { ApiSuccessResponse, Transaction } from "./types";

// ─────────────────────────────────────────────────────
//  transactions.ts
//  API calls for the transaction module.
// ─────────────────────────────────────────────────────

export const transactionsApi = {
  // GET /api/v1/transactions/my-transactions
  getMyTransactions: async (params?: Record<string, string | number>) => {
    const { data } = await api.get<ApiSuccessResponse<Transaction[]>>(
      "/transactions/my-transactions",
      { params }
    );
    return data;
  },

  // GET /api/v1/transactions
  getAll: async (params?: Record<string, string | number>) => {
    const { data } = await api.get<ApiSuccessResponse<Transaction[]>>(
      "/transactions",
      { params }
    );
    return data;
  },

  // GET /api/v1/transactions/booth/:boothId
  getBoothTransactions: async (boothId: string, params?: Record<string, string | number>) => {
    const { data } = await api.get<ApiSuccessResponse<Transaction[]>>(
      `/transactions/booth/${boothId}`,
      { params }
    );
    return data;
  },

  // POST /api/v1/transactions/process-toll
  processToll: async (payload: { rfidTag?: string; licensePlate?: string; boothId: string }) => {
    const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
      "/transactions/process-toll",
      payload
    );
    return data;
  },
};