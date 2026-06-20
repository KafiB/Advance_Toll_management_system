import api from "./axios";
import { ApiSuccessResponse, BlacklistRecord, BlacklistReason } from "./types";

export const blacklistApi = {
  // GET /api/v1/blacklist
  getAll: async (params?: Record<string, string | number>) => {
    const { data } = await api.get<ApiSuccessResponse<BlacklistRecord[]>>(
      "/blacklist",
      { params }
    );
    return data;
  },

  // POST /api/v1/blacklist
  create: async (payload: {
    vehicleId: string;
    reason: BlacklistReason;
    description: string;
    unpaidAmount?: number;
  }) => {
    const { data } = await api.post<ApiSuccessResponse<BlacklistRecord>>(
      "/blacklist",
      payload
    );
    return data;
  },

  // PUT /api/v1/blacklist/:id/resolve
  resolve: async (id: string, resolutionNotes: string) => {
    const { data } = await api.put<ApiSuccessResponse<BlacklistRecord>>(
      `/blacklist/${id}/resolve`,
      { resolutionNotes }
    );
    return data;
  },

  // GET /api/v1/blacklist/my-history
  getMyHistory: async () => {
    const { data } = await api.get<ApiSuccessResponse<{
      totalRecords: number;
      history: BlacklistRecord[];
    }>>("/blacklist/my-history");
    return data;
  },
};