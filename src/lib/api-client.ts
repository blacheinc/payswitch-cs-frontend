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

            const { access_token } = response.data;

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

    // Transform error to consistent format
    const apiError: ApiError = {
      code: error.response?.data?.code || "UNKNOWN_ERROR",
      message:
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred",
      details: error.response?.data?.details,
      statusCode: error.response?.status || 500,
    };

    return Promise.reject(apiError);
  },
);

export default apiClient;
