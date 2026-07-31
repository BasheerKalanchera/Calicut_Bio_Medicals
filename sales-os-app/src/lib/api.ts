import axios, { type InternalAxiosRequestConfig } from "axios";
import { supabase } from "./supabase";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

let refreshPromise: Promise<boolean> | null = null;

function refreshAuthSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = supabase.auth
      .refreshSession()
      .then(({ data, error }) => !error && !!data.session)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshed = await refreshAuthSession();
      if (refreshed) {
        return api(originalRequest);
      }
      supabase.auth.signOut();
      window.location.href = "/";
    }

    const detail =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    const enriched = new ApiError(
      typeof detail === "string" ? detail : JSON.stringify(detail),
      error.response?.status
    );
    return Promise.reject(enriched);
  }
);

export default api;
