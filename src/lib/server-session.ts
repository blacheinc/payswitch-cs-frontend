// =============================================================================
// Server-only session helpers.
//
// The browser never sees the access or refresh tokens. They live in a single
// HttpOnly, Secure, SameSite=Strict cookie set by Next Route Handlers, and are
// read here for:
//
//   - the catch-all proxy route (attaches the bearer to backend calls)
//   - the edge middleware (reads `userType` for portal-isolation)
//
// This module MUST NOT be imported from a client component. The cookie payload
// is plain JSON — no client-side encryption is needed because the cookie is
// HttpOnly and never reaches JavaScript.
// =============================================================================

import "server-only";

import { cookies } from "next/headers";
import type { User } from "@/types/models";

export const SESSION_COOKIE = "__Host-session";

export interface ServerSession {
  accessToken: string;
  refreshToken: string;
  userType: "admin" | "org" | string;
  user: User;
  /** Unix epoch ms when the access token is expected to expire. */
  expiresAt?: number;
}

/**
 * Build a Set-Cookie attribute object suitable for `cookies().set()` in a
 * Route Handler. We use `__Host-` prefix to lock the cookie to the origin
 * (Path=/, Secure required, no Domain attribute).
 */
function cookieOptions() {
  return {
    httpOnly: true,
    // The `__Host-` prefix requires Secure. Modern browsers treat localhost
    // as a secure context, so Secure works in dev too.
    secure: true,
    sameSite: "strict" as const,
    path: "/",
    // Maximum lifetime aligned with refresh-token validity. The refresh flow
    // re-sets the cookie on each access-token refresh, sliding the expiry.
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

/**
 * Persist the session on the response. Call from any Route Handler that
 * receives a fresh login / 2FA / refresh response from the backend.
 */
export async function setServerSession(session: ServerSession): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, JSON.stringify(session), cookieOptions());
}

/** Read the session from the request cookies. Returns null on missing/malformed. */
export async function getServerSession(): Promise<ServerSession | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServerSession;
  } catch {
    return null;
  }
}

/** Update only the access-token portion of the session (after a refresh). */
export async function updateServerAccessToken(
  accessToken: string,
  expiresAt?: number,
): Promise<void> {
  const current = await getServerSession();
  if (!current) return;
  await setServerSession({
    ...current,
    accessToken,
    expiresAt: expiresAt ?? current.expiresAt,
  });
}

/** Replace the user portion (e.g. after `GET /auth/me` returns updated profile). */
export async function updateServerSessionUser(user: User): Promise<void> {
  const current = await getServerSession();
  if (!current) return;
  await setServerSession({ ...current, user });
}

export async function clearServerSession(): Promise<void> {
  const jar = await cookies();
  // For `__Host-`-prefixed cookies the browser only matches a deletion if the
  // expiring Set-Cookie carries the same Secure + Path=/ attributes as the
  // original. `jar.delete(name)` doesn't always do that — set an empty value
  // with maxAge: 0 + the full options so the browser definitely drops it.
  jar.set(SESSION_COOKIE, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}
