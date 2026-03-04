import apiClient from "./api-client";
import type { User } from "@/types/models";
import type { AuthResult, Setup2FAResponse } from "@/types/auth-type";
import { API_ENDPOINTS } from "@/lib/constant";

// Helper to parse JWT and extract a User object
function parseJwt(token: string): User {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    const decoded = JSON.parse(jsonPayload);

    return {
      id: decoded.sub || decoded.id || "unknown",
      email: decoded.email || decoded.sub,
      name:
        decoded.name || (decoded.email ? decoded.email.split("@")[0] : "User"),
      roleLabel: decoded.role || decoded.user_type || "viewer",
      status: "active",
      createdAt: new Date().toISOString(),
    } as User;
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return {
      id: "unknown",
      email: "unknown",
      name: "Unknown User",
      roleLabel: "viewer",
      status: "active",
      createdAt: new Date().toISOString(),
    } as User;
  }
}

// ---- Raw API response types (snake_case, matching backend) ----

interface ApiLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_type: string;
  requires_2fa?: boolean;
  email?: string | null;
}

interface Api2FAResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/** POST /auth/refresh → only returns a new access_token (no refresh_token rotation) */
interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ApiSetup2FAResponse {
  secret: string;
  uri: string;
  message: string;
}

// ---- Service ----

export const authService = {
  // POST /auth/login
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const response = await apiClient.post<ApiLoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    const data = response.data;

    if (data.requires_2fa) {
      return {
        requires2FA: true,
        accessToken: data.access_token, // temp token for 2FA
      };
    }

    const user = parseJwt(data.access_token);

    // Prefer the email from the API response over whatever was in the JWT
    if (data.email) {
      user.email = data.email;
    }

    return {
      requires2FA: false,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      user,
      userType: data.user_type,
    };
  },

  // POST /auth/2fa/verify — spec requires { code, temp_token }
  async verify2FA(data: {
    code: string;
    tempToken: string;
  }): Promise<AuthResult> {
    const payload = {
      code: data.code,
      temp_token: data.tempToken,
    };

    const response = await apiClient.post<Api2FAResponse>(
      API_ENDPOINTS.AUTH.VERIFY_2FA,
      payload,
    );

    const user = parseJwt(response.data.access_token);
    const userType = user.roleLabel || "viewer";

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenType: response.data.token_type,
      expiresIn: response.data.expires_in,
      user,
      userType,
    };
  },

  // POST /auth/logout → SuccessResponse
  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.LOGOUT,
    );
    return response.data;
  },

  // POST /auth/refresh → TokenResponse (no refresh_token rotation)
  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await apiClient.post<ApiTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refresh_token: token },
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  },

  // POST /auth/forgot-password → SuccessResponse
  async forgotPassword(
    email: string,
    callbackUrl?: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      {
        email,
        callback_url: callbackUrl,
      },
    );
    return response.data;
  },

  // POST /auth/reset-password → SuccessResponse
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      {
        token,
        new_password: password,
      },
    );
    return response.data;
  },

  // POST /auth/verify-email → SuccessResponse
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { token },
    );
    return response.data;
  },

  // POST /auth/change-password → SuccessResponse (authenticated)
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
    );
    return response.data;
  },

  // POST /auth/2fa/setup → Setup2FAResponse (authenticated)
  async setup2FA(): Promise<Setup2FAResponse> {
    const response = await apiClient.post<ApiSetup2FAResponse>(
      API_ENDPOINTS.AUTH.SETUP_2FA,
    );
    return {
      secret: response.data.secret,
      uri: response.data.uri,
      message: response.data.message,
    };
  },
};
