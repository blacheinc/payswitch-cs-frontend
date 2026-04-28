// =============================================================================
// Browser-side, NON-SECRET session cache.
//
// The HARD session — access + refresh tokens — lives in an HttpOnly cookie set
// by Next Route Handlers (`src/app/api/auth/*`) and is never exposed to JS.
//
// What still lives client-side: a tiny non-sensitive cache of the user shape
// (id, name, email, permissions, userType) so the UI can render immediately on
// reload without waiting for `/api/auth/me` to round-trip.
//
// Stored in localStorage. NOT a cookie — the proxy reads `userType` from the
// HttpOnly cookie directly. This cache is purely a render hint.
// =============================================================================

import type { User } from "@/types/models";

const CACHE_KEY = "user_cache";

export interface UserCache {
  user: User;
  userType: string;
}

export function saveUserCache(data: UserCache): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be disabled (incognito, quota); UI just won't have a
    // cached render. Cookie auth still works.
  }
}

export function getUserCache(): UserCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserCache;
  } catch {
    return null;
  }
}

export function clearUserCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
