// =============================================================================
// POST /api/auth/login
//
// Browser → here. We forward to the backend, capture the access + refresh
// tokens server-side into an HttpOnly cookie, and return ONLY the user-facing
// payload to the browser. Tokens never appear in JS.
//
// Two response shapes mirror the backend:
//   { requires_2fa: true, ... }              → caller renders the 2FA UI
//   { access_token, refresh_token, user, ... } → cookie is set, caller is logged in
// =============================================================================

import { NextResponse } from "next/server";
import { setServerSession } from "@/lib/server-session";
import { withoutPermissions } from "@/lib/user-merge";
import { BACKEND_API_URL } from "@/lib/server-config";
import type { AdminUser, User } from "@/types/models";

interface BackendLoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user_type?: string;
  email?: string;
  requires_2fa?: boolean;
  requires_password_change?: boolean;
}

/** Stand-in for a scoped session: /auth/me 401s, so we can't load the real profile. */
function placeholderUser(email: string): User {
  return {
    id: "",
    email,
    name: "",
    roleLabel: "" as User["roleLabel"],
    status: "active",
    createdAt: new Date().toISOString(),
    permissions: [],
  };
}

interface BackendUserProfile {
  id: string;
  email: string;
  name: string;
  role?: string;
  status?: string;
  user_type?: string;
  organization_id?: string | null;
  permissions?: string[];
  created_at?: string;
  totp_enabled?: boolean;
}

async function fetchProfile(
  accessToken: string,
): Promise<BackendUserProfile | null> {
  const r = await fetch(`${BACKEND_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!r.ok) return null;
  return (await r.json()) as BackendUserProfile;
}

function buildUser(
  profile: BackendUserProfile,
  fallbackEmail: string,
  userType: string,
): User {
  const base: User = {
    id: profile.id,
    email: profile.email || fallbackEmail,
    name: profile.name,
    roleLabel: profile.role as User["roleLabel"],
    status: (profile.status as User["status"]) || "active",
    createdAt: profile.created_at || new Date().toISOString(),
    permissions: profile.permissions ?? [],
    totp_enabled: profile.totp_enabled ?? false,
  };
  if (profile.organization_id) base.organizationId = profile.organization_id;

  const isAdmin = userType === "admin" || profile.user_type === "admin";
  if (isAdmin) {
    return {
      ...base,
      isAdmin: true,
      adminRole: "super_admin",
    } as AdminUser;
  }
  return base;
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Body must be JSON" } },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${BACKEND_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await upstream.json().catch(() => ({}))) as
    | BackendLoginResponse
    | Record<string, unknown>;

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  // 2FA branch — backend issues a temp token; we don't persist a session yet.
  // Return the temp token to the client so it can submit the 2FA code.
  if ((data as BackendLoginResponse).requires_2fa) {
    const d = data as BackendLoginResponse;
    return NextResponse.json({
      requires_2fa: true,
      temp_token: d.access_token,
      user_type: d.user_type,
      email: d.email,
    });
  }

  const d = data as BackendLoginResponse;

  // Scoped token, empty refresh_token. Don't demand one, and don't load the
  // profile — /auth/me 401s on this token.
  if (d.requires_password_change) {
    if (!d.access_token) {
      return NextResponse.json(
        {
          error: {
            code: "UPSTREAM_ERROR",
            message: "Login response missing access token",
          },
        },
        { status: 502 },
      );
    }

    const email = d.email || body.email || "";
    const userType = d.user_type || "org";

    await setServerSession({
      accessToken: d.access_token,
      refreshToken: "",
      userType,
      user: placeholderUser(email),
      expiresAt: d.expires_in ? Date.now() + d.expires_in * 1000 : undefined,
      passwordChangeRequired: true,
    });

    return NextResponse.json({
      requires_password_change: true,
      userType,
      email,
    });
  }

  if (!d.access_token || !d.refresh_token) {
    return NextResponse.json(
      {
        error: {
          code: "UPSTREAM_ERROR",
          message: "Login response missing tokens",
        },
      },
      { status: 502 },
    );
  }

  const profile = await fetchProfile(d.access_token);
  if (!profile) {
    return NextResponse.json(
      {
        error: {
          code: "UPSTREAM_ERROR",
          message: "Could not load user profile after login",
        },
      },
      { status: 502 },
    );
  }

  const userType = d.user_type || profile.user_type || "org";
  const user = buildUser(profile, body.email ?? "", userType);
  const expiresAt = d.expires_in
    ? Date.now() + d.expires_in * 1000
    : undefined;

  await setServerSession({
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    userType,
    user,
    expiresAt,
  });

  // Return only the user-facing portion. No tokens, no permissions.
  return NextResponse.json({ user: withoutPermissions(user), userType });
}
