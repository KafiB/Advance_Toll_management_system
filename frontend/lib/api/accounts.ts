import api from "./axios";
import { ApiSuccessResponse, Account } from "./types";

// ─────────────────────────────────────────────────────
//  accounts.ts
//  API calls for the wallet/account module.
// ─────────────────────────────────────────────────────

export const accountsApi = {
  // GET /api/v1/accounts/my-account
  getMyAccount: async () => {
    const { data } = await api.get<ApiSuccessResponse<Account>>(
      "/accounts/my-account"
    );
    return data;
  },

  // POST /api/v1/accounts/create
  create: async (payload: { initialDeposit: number; minimumBalance?: number }) => {
    const { data } = await api.post<ApiSuccessResponse<Account>>(
      "/accounts/create",
      payload
    );
    return data;
  },

  // POST /api/v1/accounts/top-up
  topUp: async (payload: { amount: number; paymentMethod?: string; paymentReference?: string }) => {
    const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
      "/accounts/top-up",
      payload
    );
    return data;
  },

  // PUT /api/v1/accounts/minimum-balance
  updateMinimumBalance: async (minimumBalance: number) => {
    const { data } = await api.put<ApiSuccessResponse<Record<string, unknown>>>(
      "/accounts/minimum-balance",
      { minimumBalance }
    );
    return data;
  },

  // PUT /api/v1/accounts/auto-recharge
  toggleAutoRecharge: async (payload: {
    isEnabled: boolean;
    rechargeAmount?: number;
    triggerAmount?: number;
  }) => {
    const { data } = await api.put<ApiSuccessResponse<Record<string, unknown>>>(
      "/accounts/auto-recharge",
      payload
    );
    return data;
  },
};