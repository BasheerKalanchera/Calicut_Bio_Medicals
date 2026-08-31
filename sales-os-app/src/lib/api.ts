import axios, { type InternalAxiosRequestConfig } from "axios";
import { supabase } from "./supabase";

export class ApiError extends Error {
  status?: number;
  // Structured payload alongside `message`, for callers that need to react to
  // *why* the request failed, not just show text -- e.g. the account-creation
  // near-duplicate warning (error_code "POSSIBLE_DUPLICATE") needs the
  // candidate list, not just a human-readable sentence.
  errorCode?: string;
  candidates?: { id: string; name: string }[];
  constructor(
    message: string,
    status?: number,
    errorCode?: string,
    candidates?: { id: string; name: string }[]
  ) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.candidates = candidates;
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
      error.response?.status,
      error.response?.data?.error_code,
      error.response?.data?.candidates
    );
    return Promise.reject(enriched);
  }
);

export default api;
