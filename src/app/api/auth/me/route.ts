// =============================================================================
// GET /api/auth/me
//
// Returns the current user (from the HttpOnly cookie). Optionally re-fetches
// the latest profile from the backend so callers can refresh their permission
// list without a round-trip to login.
//
// 401 when no cookie. The browser-side AuthContext uses this on mount to
// determine whether the user is signed in.
// =============================================================================

import { NextResponse } from "next/server";
import {
  getServerSession,
  updateServerSessionUser,
} from "@/lib/server-session";
import { BACKEND_API_URL } from "@/lib/server-config";
import { mergeUserFromMeProfile } from "@/lib/user-merge";
import type { UserProfileResponse } from "@/types/auth-type";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "AUTHENTICATION_ERROR", message: "Not signed in" } },
      { status: 401 },
    );
  }

  // Best-effort: refresh the user shape from backend /auth/me so permission
  // lists stay current. If it fails we keep the cached cookie copy.
  try {
    const r = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (r.ok) {
      const profile = (await r.json()) as UserProfileResponse;
      const merged = mergeUserFromMeProfile(
        session.user,
        profile,
        session.userType,
      );
      await updateServerSessionUser(merged);
      return NextResponse.json({ user: merged, userType: session.userType });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ user: session.user, userType: session.userType });
}
