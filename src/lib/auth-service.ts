import apiClient from "./api-client";
import type { User } from "@/types/models";
import type {
  AuthResult,
  Setup2FAResponse,
  UserPermissionsResponse,
  UserProfileResponse,
} from "@/types/auth-type";
import { API_ENDPOINTS } from "@/lib/constant";

// `mergeUserFromMeProfile` lives in its own pure module so server-side Route
// Handlers can import it without dragging in axios. Re-exported here so
// existing callers can continue importing it from `auth-service`.
export { mergeUserFromMeProfile } from "./user-merge";

// =============================================================================
// IMPORTANT
//
// Login / 2FA / refresh / logout call **Next Route Handlers** at /api/auth/*,
// NOT the backend directly. Those routes set/clear the HttpOnly session cookie
// server-side; the browser never sees access or refresh tokens.
//
// Everything else (getMe, changePassword, setup2FA, …) goes through the same
// axios `apiClient` as before — but the client is now pointed at /api/proxy,
// which forwards to the backend with the bearer attached server-side.
// =============================================================================

interface LoginResponseShape {
  user?: User;
  userType?: string;
  // 2FA branch:
  requires_2fa?: boolean;
  temp_token?: string;
  email?: string;
  // Forced first-login password change branch:
  requires_password_change?: boolean;
  // Error branch:
  error?: { code?: string; message?: string };
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) {
    const message =
      (data?.error as Record<string, unknown> | undefined)?.message ||
      (data?.message as string) ||
      `Request failed (${r.status})`;
    throw {
      code:
        (data?.error as Record<string, unknown> | undefined)?.code ||
        data?.code ||
        "REQUEST_FAILED",
      message,
      statusCode: r.status,
    };
  }
  return data as T;
}

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(path, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) {
    throw {
      code:
        (data?.error as Record<string, unknown> | undefined)?.code ||
        "REQUEST_FAILED",
      message:
        (data?.error as Record<string, unknown> | undefined)?.message ||
        `Request failed (${r.status})`,
      statusCode: r.status,
    };
  }
  return data as T;
}

export const authService = {
  /**
   * POST /api/auth/login (Next Route Handler).
   *
   * On success the HttpOnly cookie is set by the server. The browser receives
   * only the user payload (no tokens). On 2FA path the server returns a
   * `temp_token` for the follow-up `verify2FA` call.
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const data = await postJson<LoginResponseShape>(
      "/api/auth/login",
      credentials,
    );

    if (data.requires_2fa) {
      return {
        requires2FA: true,
        accessToken: data.temp_token, // surfaced as "tempToken" by callers
        userType: data.userType,
      };
    }

    // Scoped session set — caller must route to /change-password.
    if (data.requires_password_change) {
      return {
        requiresPasswordChange: true,
        userType: data.userType,
      };
    }

    return {
      requires2FA: false,
      user: data.user,
      userType: data.userType,
    };
  },

  /**
   * POST /api/auth/2fa/verify (Next Route Handler).
   * Server sets the HttpOnly cookie; we receive the resolved user.
   */
  async verify2FA(payload: {
    code: string;
    tempToken: string;
  }): Promise<AuthResult> {
    const data = await postJson<{
      user?: User;
      userType?: string;
      requires_password_change?: boolean;
    }>("/api/auth/2fa/verify", {
      code: payload.code,
      temp_token: payload.tempToken,
    });

    if (data.requires_password_change) {
      return { requiresPasswordChange: true, userType: data.userType };
    }

    return {
      user: data.user,
      userType: data.userType,
    };
  },

  /** POST /api/auth/refresh — used internally; clients rarely call this. */
  async refreshToken(): Promise<{ ok: true }> {
    await postJson<{ ok: true }>("/api/auth/refresh");
    return { ok: true };
  },

  /** POST /api/auth/logout — clears the HttpOnly cookie. */
  async logout(): Promise<{ message: string }> {
    return await postJson<{ message: string }>("/api/auth/logout");
  },

  /**
   * GET /api/auth/me — Next Route Handler reads the cookie and (best-effort)
   * refreshes the user shape from the backend's /auth/me. Returns the merged
   * user.
   */
  async getMe(): Promise<UserProfileResponse> {
    const data = await getJson<{ user: User; userType: string }>(
      "/api/auth/me",
    );
    // Adapt to the existing UserProfileResponse contract callers consume.
    const u = data.user as unknown as Record<string, unknown>;
    return {
      id: u.id as string,
      email: u.email as string,
      name: u.name as string,
      role: (u.roleLabel as string) || (u.role as string),
      status: u.status as string,
      user_type: data.userType,
      organization_id: (u.organizationId as string) ?? null,
      totp_enabled: (u.totp_enabled as boolean) ?? false,
      created_at: u.createdAt as string,
      last_login_at: u.lastLoginAt as string | undefined,
    } as unknown as UserProfileResponse;
  },

  /** GET /api/proxy/auth/me/permissions — straight pass-through. */
  async getMyPermissions(): Promise<UserPermissionsResponse> {
    const response = await apiClient.get<UserPermissionsResponse>(
      API_ENDPOINTS.AUTH.ME_PERMISSIONS,
    );
    return response?.data;
  },

  // ---- Endpoints that don't manage the session cookie ----

  async forgotPassword(
    email: string,
    callbackUrl?: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email, callback_url: callbackUrl },
    );
    return response?.data;
  },

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      { token, new_password: password },
    );
    return response?.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { token },
    );
    return response?.data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      { current_password: currentPassword, new_password: newPassword },
    );
    return response?.data;
  },

  async setup2FA(): Promise<Setup2FAResponse> {
    const response = await apiClient.post<{
      secret: string;
      uri: string;
      message: string;
      temp_token: string;
    }>(API_ENDPOINTS.AUTH.SETUP_2FA);
    return {
      secret: response?.data?.secret,
      uri: response?.data?.uri,
      message: response?.data?.message,
      tempToken: response?.data?.temp_token,
    };
  },

  async remove2FA(
    data: import("@/types/auth-type").Remove2FARequest,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.REMOVE_2FA,
      data,
    );
    return response?.data;
  },
};
