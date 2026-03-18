import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/types/models";
import { API_ENDPOINTS } from "@/lib/constant";
import {
  getAccessToken,
  getRefreshToken,
  updateTokens,
  clearSession,
  saveSession,
  getSession,
  type SessionData,
} from "@/lib/session-storage";

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== BACKWARD-COMPATIBLE EXPORTS ====================
// These delegate to session-storage so existing imports keep working.

export const getAuthToken = (): string | null => getAccessToken();

export const setAuthToken = (token: string): void => {
  const session = getSession();
  if (session) {
    saveSession({ ...session, accessToken: token });
  }
};

export const removeAuthToken = (): void => clearSession();

export const setRefreshToken = (token: string): void => {
  const session = getSession();
  if (session) {
    saveSession({ ...session, refreshToken: token });
  }
};

export { getRefreshToken, saveSession, getSession, clearSession };
export type { SessionData };

// ==================== INTERCEPTORS ====================

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[API] ${config.method?.toUpperCase()} ${config.url}`,
        config.data,
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] Response:`, response.data);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && originalRequest) {
      // Skip refresh logic for auth endpoints — a 401 here means
      // invalid credentials, not an expired token.
      const isAuthEndpoint = originalRequest.url?.startsWith("/auth/");
      if (!isAuthEndpoint) {
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          try {
            const response = await axios.post(
              `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
              {
                refresh_token: refreshToken,
              },
            );

            const { access_token } = response?.data || {};

            // Update only the access token — API does not rotate refresh tokens
            updateTokens(access_token);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return apiClient(originalRequest);
          } catch {
            // Refresh failed - clear session and redirect to login
            clearSession();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        } else {
          // No refresh token - redirect to login
          clearSession();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }
    }

    // ---- Network-level errors (no server response) ----
    if (!error.response) {
      let userMessage = "Something went wrong. Please try again.";

      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        userMessage =
          "The server is taking too long to respond. Please try again later.";
      } else if (
        error.code === "ERR_NETWORK" ||
        error?.message === "Network Error"
      ) {
        userMessage =
          "Unable to connect. Please check your internet connection.";
      } else if (error.code === "ECONNREFUSED") {
        userMessage = "Unable to reach the server. Please try again later.";
      }

      const networkError: ApiError = {
        code: error.code || "NETWORK_ERROR",
        message: userMessage,
        statusCode: 0,
      };
      return Promise.reject(networkError);
    }

    // ---- Server responded with an error status ----

    // The API uses two error shapes:
    // 1) Business-logic: { code, message, details? } (flat)
    //    or wrapped:     { error: { code, message, details? } }
    // 2) FastAPI 422:    { detail: [{ loc, msg, type }] }
    const body = error.response?.data;

    // Handle FastAPI 422 validation errors
    const detail = (body as unknown as Record<string, unknown>)?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      const apiError: ApiError = {
        code: "VALIDATION_ERROR",
        message: first.msg || "Validation error",
        details: { validationErrors: detail },
        statusCode: error.response?.status || 422,
      };
      return Promise.reject(apiError);
    }

    // Handle business-logic errors (nested or flat)
    const nested = (body as unknown as Record<string, unknown>)?.error as
      | Record<string, unknown>
      | undefined;

    // Map common HTTP status codes to user-friendly fallback messages
    const httpFallback: Record<number, string> = {
      400: "Invalid request. Please check your input and try again.",
      403: "You don't have permission to perform this action.",
      404: "The requested resource was not found.",
      409: "A conflict occurred. The resource may have been modified.",
      429: "Too many requests. Please wait a moment and try again.",
      500: "An internal server error occurred. Please try again later.",
      502: "The server is temporarily unavailable. Please try again later.",
      503: "The service is currently unavailable. Please try again later.",
    };

    const apiError: ApiError = {
      code: (nested?.code as string) || body?.code || "UNKNOWN_ERROR",
      message:
        (nested?.message as string) ||
        body?.message ||
        httpFallback[error.response?.status || 0] ||
        "An unexpected error occurred. Please try again.",
      details: (nested?.details as Record<string, unknown>) || body?.details,
      statusCode: error.response?.status || 500,
    };

    return Promise.reject(apiError);
  },
);

export default apiClient;
