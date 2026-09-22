// =============================================================================
// POST /api/auth/2fa/verify
//
// Caller posts { code, temp_token } (temp_token came from /api/auth/login when
// requires_2fa was true). We forward to the backend, set the resulting
// HttpOnly session cookie, and return the user payload.
// =============================================================================

import { NextResponse } from "next/server";
import { setServerSession } from "@/lib/server-session";
import { BACKEND_API_URL } from "@/lib/server-config";
import type { AdminUser, User } from "@/types/models";

interface BackendVerifyResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  message?: string;
  requires_password_change?: boolean;
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
}

export async function POST(request: Request) {
  let body: { code?: string; temp_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Body must be JSON" } },
      { status: 400 },
    );
  }

  if (!body.code || !body.temp_token) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "code and temp_token are required",
        },
      },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${BACKEND_API_URL}/auth/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await upstream.json().catch(() => ({}))) as
    | BackendVerifyResponse
    | Record<string, unknown>;

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const d = data as BackendVerifyResponse;

  // Same scoped-token branch as the login route.
  if (d.requires_password_change) {
    if (!d.access_token) {
      return NextResponse.json(
        {
          error: {
            code: "UPSTREAM_ERROR",
            message: "2FA response missing access token",
          },
        },
        { status: 502 },
      );
    }
    await setServerSession({
      accessToken: d.access_token,
      refreshToken: "",
      userType: "org",
      user: {
        id: "",
        email: "",
        name: "",
        roleLabel: "" as User["roleLabel"],
        status: "active",
        createdAt: new Date().toISOString(),
        permissions: [],
      },
      expiresAt: d.expires_in ? Date.now() + d.expires_in * 1000 : undefined,
      passwordChangeRequired: true,
    });

    return NextResponse.json({ requires_password_change: true });
  }

  if (!d.access_token || !d.refresh_token) {
    return NextResponse.json(
      {
        error: {
          code: "UPSTREAM_ERROR",
          message: "2FA response missing tokens",
        },
      },
      { status: 502 },
    );
  }

  const profileRes = await fetch(`${BACKEND_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${d.access_token}` },
    cache: "no-store",
  });
  if (!profileRes.ok) {
    return NextResponse.json(
      {
        error: {
          code: "UPSTREAM_ERROR",
          message: "Could not load user profile after 2FA",
        },
      },
      { status: 502 },
    );
  }
  const profile = (await profileRes.json()) as BackendUserProfile;

  const userType =
    profile.user_type || (profile.organization_id ? "org" : "admin");

  const baseUser: User = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    roleLabel: profile.role as User["roleLabel"],
    status: (profile.status as User["status"]) || "active",
    createdAt: profile.created_at || new Date().toISOString(),
    permissions: profile.permissions ?? [],
  };
  if (profile.organization_id) baseUser.organizationId = profile.organization_id;

  const user: User =
    userType === "admin"
      ? ({ ...baseUser, isAdmin: true, adminRole: "super_admin" } as AdminUser)
      : baseUser;

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

  return NextResponse.json({ user, userType, message: d.message });
}
