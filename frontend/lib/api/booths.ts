import api from "./axios";
import { ApiSuccessResponse, Booth } from "./types";

// ─────────────────────────────────────────────────────
//  booths.ts
//  API calls for the booth management module.
// ─────────────────────────────────────────────────────

export const boothsApi = {
  // GET /api/v1/booths
  getAll: async (params?: Record<string, string | number | boolean>) => {
    const { data } = await api.get<ApiSuccessResponse<Booth[]>>("/booths", {
      params,
    });
    return data;
  },

  // GET /api/v1/booths/:id
  getById: async (id: string) => {
    const { data } = await api.get<ApiSuccessResponse<Booth>>(`/booths/${id}`);
    return data;
  },

  // GET /api/v1/booths/:id/stats
  getStats: async (id: string) => {
    const { data } = await api.get<ApiSuccessResponse<Record<string, unknown>>>(
      `/booths/${id}/stats`
    );
    return data;
  },



  // Add inside boothsApi object:

  create: async (payload: Partial<Booth>) => {
    const { data } = await api.post<ApiSuccessResponse<Booth>>("/booths", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Booth>) => {
    const { data } = await api.put<ApiSuccessResponse<Booth>>(`/booths/${id}`, payload);
    return data;
  },

  updateStatus: async (id: string, status: string, maintenanceNotes?: string) => {
    const { data } = await api.put<ApiSuccessResponse<Booth>>(`/booths/${id}/status`, {
      status,
      maintenanceNotes,
    });
    return data;
  },

  updateTollRates: async (id: string, rates: Record<string, number>) => {
    const { data } = await api.put<ApiSuccessResponse<Booth>>(
      `/booths/${id}/toll-rates`,
      rates
    );
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiSuccessResponse>(`/booths/${id}`);
    return data;
  },
  
};