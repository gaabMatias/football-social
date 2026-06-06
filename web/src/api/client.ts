import axios, { AxiosError, type AxiosInstance } from "axios";

const TOKEN_KEY = "analysis_core_token";

const baseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000";

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

interface ZodIssueShape {
  path?: (string | number)[];
  message?: string;
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data) {
      // Fastify+Zod default: array of zod issues serialised in the body.
      if (Array.isArray(data)) {
        const issues = data as ZodIssueShape[];
        return issues
          .map((iss) => {
            const path = (iss.path ?? []).join(".") || "request";
            return `${path}: ${iss.message ?? "invalid"}`;
          })
          .join("; ");
      }
      if (typeof data === "object") {
        const obj = data as { message?: string; error?: string; statusMessage?: string };
        if (obj.message) return obj.message;
        if (obj.error) return obj.error;
        if (obj.statusMessage) return obj.statusMessage;
      }
      if (typeof data === "string" && data.length > 0) return data;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
