import apiClient from "./api-client";
import { User, LoginResponse, AuthResponse } from "@/types/models";
import { API_ENDPOINTS } from "@/lib/constant";

// Helper to parse JWT
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

    // Map JWT claims to User object
    // Adjust these fields based on actual JWT content from your backend
    return {
      id: decoded.sub || decoded.id || "unknown",
      email: decoded.email || decoded.sub, // 'sub' is often email in some systems if not separate
      name:
        decoded.name || (decoded.email ? decoded.email.split("@")[0] : "User"),
      roleLabel: decoded.role || decoded.user_type || "viewer", // Mapping to UserRoleLabel if possible
      status: "active",
      createdAt: new Date().toISOString(), // Placeholder
    } as User;
  } catch (e) {
    console.error("Failed to parse JWT", e);
    // Return a fallback user
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

// Define strict API response types to match backend (snake_case)
interface ApiLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_type: string;
  requires_2fa?: boolean;
}

interface Api2FAResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authService = {
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<ApiLoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    const data = response.data;

    // Handle 2FA case
    if (data.requires_2fa) {
      return {
        requires2FA: true,
        accessToken: data.access_token, // Used as temp token for 2FA
      };
    }

    // Extract user from token since API doesn't return it
    const user = parseJwt(data.access_token);

    return {
      requires2FA: false,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: user,
      userType: data.user_type,
    };
  },

  async verify2FA(data: {
    email: string;
    code: string;
    tempToken?: string;
  }): Promise<AuthResponse> {
    // Spec requires: { code, temp_token }
    // Note: 'email' is in the input data but not used in the payload for this endpoint per spec.
    const payload = {
      code: data.code,
      temp_token: data.tempToken,
    };

    const response = await apiClient.post<Api2FAResponse>(
      API_ENDPOINTS.AUTH.VERIFY_2FA,
      payload,
    );

    // Extract user from token
    const user = parseJwt(response.data.access_token);
    // Determine user type from token role mapping
    const userType = user.roleLabel || "viewer";

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      user: user,
      userType: userType,
    };
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<{
      access_token: string;
      // refresh_token might not be returned if rotation isn't enabled, but we check for it
      refresh_token?: string;
    }>(API_ENDPOINTS.AUTH.REFRESH, {
      refresh_token: token,
    });

    return {
      accessToken: response.data.access_token,
      // Use new refresh token if provided, else keep old one (handled by caller typically, but here we return what we get)
      // If API doesn't return it, the interceptor will need to handle retaining the old one or we return undefined/old one here.
      // API Spec for TokenResponse: access_token, token_type, expires_in. No refresh_token listed?
      // If so, we might need to reuse the old one.
      refreshToken: response.data.refresh_token || token,
    };
  },

  async forgotPassword(email: string, callbackUrl?: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email,
      callback_url: callbackUrl,
    });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      new_password: password,
    });
  },
};
