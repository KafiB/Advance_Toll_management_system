import axios from "axios";

// ─────────────────────────────────────────────────────
//  axios.ts
//  Central HTTP client for all API calls.
//
//  Every request automatically:
//  - Sends the JWT token (if logged in)
//  - Points to your backend base URL
//
//  Every response automatically:
//  - Unwraps errors into a consistent format
//  - Redirects to login if token is invalid (401)
// ─────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // http://localhost:5000/api/v1
  headers: {
    "Content-Type": "application/json",
  },
});

// ── REQUEST INTERCEPTOR ────────────────────────────────
// Attaches the JWT token to every outgoing request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── RESPONSE INTERCEPTOR ───────────────────────────────
// Handles global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid/expired — clear storage and redirect
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Avoid redirect loop if already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    // Always return a consistent error shape
    const message =
      error.response?.data?.message || "Something went wrong. Please try again.";

    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;