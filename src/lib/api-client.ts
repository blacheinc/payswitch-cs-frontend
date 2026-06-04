// =============================================================================
// Browser-side API client.
//
// Every authenticated call goes to `/api/proxy/...` on the same origin. The
// Next Route Handler at src/app/api/proxy/[...path]/route.ts:
//   - reads the HttpOnly session cookie
//   - attaches Authorization: Bearer <token> server-side
//   - refreshes the token + retries on 401
//   - forwards the response back here
//
// As a result this client carries NO bearer logic, NO refresh logic, and NO
// access to tokens. Its only jobs are:
//   - point at /api/proxy
//   - normalize errors into the existing ApiError shape so callers don't change
//   - redirect to /login if the proxy returns 401 (refresh failed server-side)
// =============================================================================

import axios, { AxiosError, AxiosInstance } from "axios";
import { ApiError } from "@/types/models";

const API_BASE_URL = "/api/proxy";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  // Same-origin only; cookies travel automatically.
  withCredentials: true,
});

// =============================================================================
// Response interceptor — normalize errors, bounce on 401.
// =============================================================================
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Hard 401 from the proxy means the refresh attempt also failed → the
    // session is gone. Send the user to /login.
    if (error.response?.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/2fa/verify") ||
        error.config?.url?.includes("/auth/refresh");
      if (!isAuthEndpoint && typeof window !== "undefined") {
        window.location.href = "/login";
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

      return Promise.reject<ApiError>({
        code: error.code || "NETWORK_ERROR",
        message: userMessage,
        statusCode: 0,
        retryable: true,        // transport blip — safe to try again
      });
    }

    // ---- Server responded with an error status ----
    const status = error.response.status;
    const body = error.response?.data;
    const bodyRec = (body as unknown as Record<string, unknown>) ?? {};

    // ── Validation envelope (422) ─────────────────────────────────────────
    //
    // Two shapes ship from the backend at status 422:
    //
    //   (a) FastAPI's array-form  →  { detail: [{ loc, msg, type }, ...] }
    //   (b) Our spec's string form →  { error: "validation_error", detail: "loan_request → amount: Input should be greater than 0" }
    //
    // Both are routed through the same VALIDATION_ERROR branch so callers
    // get a uniform shape with `fieldError: true` and (when we can parse it)
    // a `field` key the form can attach the error to.
    // ─────────────────────────────────────────────────────────────────────
    const detail = bodyRec.detail;

    // Shape (a) — array form
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string; loc?: unknown[] };
      const loc = Array.isArray(first.loc) ? first.loc.join(".") : undefined;
      return Promise.reject<ApiError>({
        code: "VALIDATION_ERROR",
        message: first.msg || "Validation error",
        details: { validationErrors: detail },
        statusCode: status || 422,
        fieldError: true,
        field: loc,
      });
    }

    // Shape (b) — string form. The spec emits messages of the form
    // "<path> → <reason>" — split once on the arrow if it's there.
    if (
      typeof bodyRec.error === "string" &&
      bodyRec.error === "validation_error" &&
      typeof detail === "string"
    ) {
      const arrowIdx = detail.indexOf("→");
      const field =
        arrowIdx >= 0 ? detail.slice(0, arrowIdx).trim() : undefined;
      const reason =
        arrowIdx >= 0 ? detail.slice(arrowIdx + 1).trim() : detail;
      return Promise.reject<ApiError>({
        code: "VALIDATION_ERROR",
        message: reason,
        details: { raw: detail },
        statusCode: status || 422,
        fieldError: true,
        field,
      });
    }

    // ── Business-logic error (Shape A — nested `error.code/message`) ──────
    const nested = bodyRec.error as Record<string, unknown> | undefined;

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

    const errorCode =
      (nested?.code as string) || body?.code || "UNKNOWN_ERROR";
    let errorMessage =
      (nested?.message as string) ||
      body?.message ||
      httpFallback[status || 0] ||
      "An unexpected error occurred. Please try again.";

    if (status === 403 && errorCode === "AUTHORIZATION_ERROR") {
      errorMessage =
        errorMessage || "You don't have permission to perform this action.";
    }

    // Status-derived UX flags so callers don't have to switch on numbers.
    const forbidden = status === 403;
    const notFound = status === 404;
    const retryAfterHeader = error.response.headers?.["retry-after"];
    const retryAfter =
      status === 429 && retryAfterHeader
        ? Number(retryAfterHeader) || 1
        : undefined;
    // 502 SCORING_ERROR (and any plain 502/503) are retryable per spec.
    const retryable = status === 502 || status === 503;

    return Promise.reject<ApiError>({
      code: errorCode,
      message: errorMessage,
      details: (nested?.details as Record<string, unknown>) || body?.details,
      statusCode: status || 500,
      forbidden,
      notFound,
      retryable,
      retryAfter,
    });
  },
);

export default apiClient;
