import api from "./axios";
import { ApiSuccessResponse, Vehicle } from "./types";

// ─────────────────────────────────────────────────────
//  vehicles.ts
//  API calls for the vehicle management module.
// ─────────────────────────────────────────────────────

export const vehiclesApi = {
  // GET /api/v1/vehicles/my-vehicles
  getMyVehicles: async () => {
    const { data } = await api.get<ApiSuccessResponse<{ count: number; vehicles: Vehicle[] }>>(
      "/vehicles/my-vehicles"
    );
    return data;
  },

  // GET /api/v1/vehicles/:id
  getById: async (id: string) => {
    const { data } = await api.get<ApiSuccessResponse<Vehicle>>(`/vehicles/${id}`);
    return data;
  },

  // POST /api/v1/vehicles/register
  register: async (payload: Partial<Vehicle>) => {
    const { data } = await api.post<ApiSuccessResponse<{ vehicle: Vehicle; tollRate: number }>>(
      "/vehicles/register",
      payload
    );
    return data;
  },

  // PUT /api/v1/vehicles/:id
  update: async (id: string, payload: Partial<Vehicle>) => {
    const { data } = await api.put<ApiSuccessResponse<Vehicle>>(`/vehicles/${id}`, payload);
    return data;
  },

  // GET /api/v1/vehicles (admin/operator)
  getAll: async (params?: Record<string, string | number | boolean>) => {
    const { data } = await api.get<ApiSuccessResponse<Vehicle[]>>("/vehicles", { params });
    return data;
  },

  // PUT /api/v1/vehicles/:id/assign-rfid
  assignRfid: async (id: string, rfidTag: string) => {
    const { data } = await api.put<ApiSuccessResponse<Vehicle>>(
      `/vehicles/${id}/assign-rfid`,
      { rfidTag }
    );
    return data;
  },

  // DELETE /api/v1/vehicles/:id
  delete: async (id: string) => {
    const { data } = await api.delete<ApiSuccessResponse>(`/vehicles/${id}`);
    return data;
  },
};