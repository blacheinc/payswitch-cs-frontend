// =============================================================================
// POST /api/auth/refresh
//
// Reads the refresh-token from the HttpOnly session cookie, calls the backend
// /auth/refresh endpoint, and replaces the access-token portion of the cookie.
// Used both as a standalone endpoint AND from the catch-all proxy when an
// upstream call returns 401.
// =============================================================================

import { NextResponse } from "next/server";
import {
  clearServerSession,
  getServerSession,
  updateServerAccessToken,
} from "@/lib/server-session";
import { BACKEND_API_URL } from "@/lib/server-config";

interface BackendRefreshResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

export async function POST() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "AUTHENTICATION_ERROR", message: "Not signed in" } },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Refresh-token invalid → drop the session entirely so the client bounces
    // through the login page.
    await clearServerSession();
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  }

  const data = (await upstream.json()) as BackendRefreshResponse;
  const expiresAt = data.expires_in
    ? Date.now() + data.expires_in * 1000
    : undefined;

  await updateServerAccessToken(data.access_token, expiresAt);
  return NextResponse.json({ ok: true });
}
