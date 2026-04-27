// =============================================================================
// POST /api/auth/logout
//
// Forwards to the backend so it can invalidate the refresh token, then clears
// the HttpOnly session cookie. Always returns 200 to the client even if the
// upstream call fails — the cookie is gone either way.
// =============================================================================

import { NextResponse } from "next/server";
import { clearServerSession, getServerSession } from "@/lib/server-session";
import { BACKEND_API_URL } from "@/lib/server-config";

export async function POST() {
  const session = await getServerSession();

  if (session) {
    try {
      await fetch(`${BACKEND_API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
    } catch {
      // Best-effort — even if upstream rejects, we still clear locally.
    }
  }

  await clearServerSession();
  return NextResponse.json({ message: "ok" });
}
