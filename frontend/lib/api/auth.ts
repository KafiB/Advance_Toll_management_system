import api from "./axios";
import {
  ApiSuccessResponse,
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
  User,
} from "./types";

// ─────────────────────────────────────────────────────
//  auth.ts
//  All authentication-related API calls.
//  Each function maps directly to one backend route.
// ─────────────────────────────────────────────────────

export const authApi = {
  // POST /api/v1/auth/register
  register: async (payload: RegisterPayload) => {
    const { data } = await api.post<ApiSuccessResponse<AuthResponseData>>(
      "/auth/register",
      payload
    );
    return data;
  },

  // POST /api/v1/auth/login
  login: async (payload: LoginPayload) => {
    const { data } = await api.post<ApiSuccessResponse<AuthResponseData>>(
      "/auth/login",
      payload
    );
    return data;
  },

  // POST /api/v1/auth/logout
  logout: async () => {
    const { data } = await api.post<ApiSuccessResponse>("/auth/logout");
    return data;
  },

  // GET /api/v1/auth/me
  getMe: async () => {
    const { data } = await api.get<ApiSuccessResponse<User>>("/auth/me");
    return data;
  },

  // PUT /api/v1/auth/update-profile
  updateProfile: async (payload: Partial<User>) => {
    const { data } = await api.put<ApiSuccessResponse<User>>(
      "/auth/update-profile",
      payload
    );
    return data;
  },

  // PUT /api/v1/auth/change-password
  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const { data } = await api.put<ApiSuccessResponse<{ token: string }>>(
      "/auth/change-password",
      payload
    );
    return data;
  },

  // POST /api/v1/auth/forgot-password
  forgotPassword: async (email: string) => {
    const { data } = await api.post<ApiSuccessResponse>(
      "/auth/forgot-password",
      { email }
    );
    return data;
  },

  // PUT /api/v1/auth/reset-password/:token
  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await api.put<ApiSuccessResponse<{ token: string }>>(
      `/auth/reset-password/${token}`,
      { newPassword }
    );
    return data;
  },

  getAllUsers: async (params?: Record<string, string | number>) => {
  const { data } = await api.get<ApiSuccessResponse<User[]>>(
    "/auth/users",
    { params }
  );
  return data;
},

deleteUser: async (id: string) => {
  const { data } = await api.delete<ApiSuccessResponse>(`/auth/users/${id}`);
  return data;
},

};

