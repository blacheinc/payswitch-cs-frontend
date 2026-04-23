import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import CryptoJS from "crypto-js";
import {
  ROUTES,
  ADMIN_ROUTE_PREFIXES,
  ORG_ROUTE_PREFIXES,
} from "@/lib/constant";

// =============================================================================
// Session cookie
// =============================================================================
//
// The session cookie is AES-encrypted with a shared secret (matches
// session-storage.ts on the client). On the server we can only decrypt it to
// inspect the `userType` claim — we never trust anything else in it for
// authorization decisions. The real authority on access lives on the API
// backend; this proxy's job is defense in depth and preventing a wrong-scope
// UI from even rendering.
//
// Follow-up hardening (not blocking the split): move tokens to an HttpOnly,
// Secure, __Host- prefixed cookie set by a Next Route Handler, and remove
// NEXT_PUBLIC_SESSION_SECRET (it's currently shipped to the browser, which
// makes the encryption mostly theatre against an attacker with DevTools).
// =============================================================================

const SESSION_SECRET =
  process.env.NEXT_PUBLIC_SESSION_SECRET || "__credit_scoring_session_key__";

interface DecodedSession {
  accessToken: string;
  refreshToken: string;
  userType: string;
  user: Record<string, unknown>;
}

function decryptSessionCookie(request: NextRequest): DecodedSession | null {
  const raw = request.cookies.get("session")?.value;
  if (!raw) return null;
  try {
    const ciphertext = decodeURIComponent(raw);
    const bytes = CryptoJS.AES.decrypt(ciphertext, SESSION_SECRET);
    const json = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) return null;
    return JSON.parse(json) as DecodedSession;
  } catch {
    return null;
  }
}

// =============================================================================
// Route classification
// =============================================================================

type Zone = "auth" | "admin" | "org" | "public";

const AUTH_PATHS = new Set<string>([
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.ADMIN_LOGIN,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
]);

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

function classifyRoute(path: string): Zone {
  if (AUTH_PATHS.has(path)) return "auth";
  if (matchesPrefix(path, ADMIN_ROUTE_PREFIXES)) return "admin";
  if (matchesPrefix(path, ORG_ROUTE_PREFIXES)) return "org";
  return "public";
}

function isAdminScope(session: DecodedSession | null): boolean {
  return session?.userType === "admin";
}

// =============================================================================
// Security headers
// =============================================================================
//
// These run on every proxied response. `next.config.ts` also sets framework-
// level headers as a second line of defense in case the proxy matcher ever
// lets a path through unprocessed.
// =============================================================================

const SECURITY_HEADERS: Record<string, string> = {
  // Never let the site be iframed — stops clickjacking regardless of CSP.
  "X-Frame-Options": "DENY",
  // Defence against MIME sniffing.
  "X-Content-Type-Options": "nosniff",
  // Limit referrer leakage across origins.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Explicitly opt out of powerful browser features this app doesn't use.
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  // Tell the browser to always upgrade to HTTPS for this origin.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

// =============================================================================
// Redirect helpers
// =============================================================================

function redirect(request: NextRequest, to: string): NextResponse {
  const url = new URL(to, request.nextUrl);
  return applySecurityHeaders(NextResponse.redirect(url));
}

/** Redirect to a login page, preserving the original path as ?next= for UX. */
function redirectToLogin(
  request: NextRequest,
  loginPath: string,
): NextResponse {
  const url = new URL(loginPath, request.nextUrl);
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  if (nextPath && nextPath !== "/" && !AUTH_PATHS.has(request.nextUrl.pathname)) {
    url.searchParams.set("next", nextPath);
  }
  return applySecurityHeaders(NextResponse.redirect(url));
}

/**
 * Rewrite the response to Next's internal 404 without changing the visible
 * URL. We use this for wrong-scope access so the user gets the styled
 * not-found page and the address bar still shows the path they attempted —
 * better UX and safer than leaking the existence of admin routes to org users
 * via a redirect.
 */
function rewriteToNotFound(request: NextRequest): NextResponse {
  return applySecurityHeaders(
    NextResponse.rewrite(new URL("/_not-found", request.url)),
  );
}

function next(): NextResponse {
  return applySecurityHeaders(NextResponse.next());
}

// =============================================================================
// Proxy (Next 16 edge middleware)
// =============================================================================

export function proxy(request: NextRequest): NextResponse {
  const path = request.nextUrl.pathname;
  const session = decryptSessionCookie(request);
  const isAuthed = session !== null;
  const isAdmin = isAdminScope(session);
  const zone = classifyRoute(path);

  // ── 1. Auth pages ────────────────────────────────────────────────────────
  // Already-authenticated users bounce to *their* dashboard. A logged-in org
  // user who hits /admin-login is sent to /dashboard — never allowed to linger
  // on the wrong login page.
  if (zone === "auth") {
    if (isAuthed) {
      const dest = isAdmin ? ROUTES.ADMIN.DASHBOARD : ROUTES.ORG.DASHBOARD;
      return redirect(request, dest);
    }
    return next();
  }

  // ── 2. Admin-scoped routes ───────────────────────────────────────────────
  if (zone === "admin") {
    if (!isAuthed) {
      return redirectToLogin(request, ROUTES.AUTH.ADMIN_LOGIN);
    }
    if (!isAdmin) {
      // Org user trying to reach an admin route → show the not-found page.
      // We deliberately don't reveal that the path exists.
      return rewriteToNotFound(request);
    }
    return next();
  }

  // ── 3. Org-scoped routes ─────────────────────────────────────────────────
  if (zone === "org") {
    if (!isAuthed) {
      return redirectToLogin(request, ROUTES.AUTH.LOGIN);
    }
    if (isAdmin) {
      // Admin trying to reach an org route → show the not-found page.
      return rewriteToNotFound(request);
    }
    return next();
  }

  // ── 4. Public / unknown routes ───────────────────────────────────────────
  // The root `/` is public; anything authed there bounces to the right
  // dashboard to avoid a stale landing page.
  if (path === "/" && isAuthed) {
    const dest = isAdmin ? ROUTES.ADMIN.DASHBOARD : ROUTES.ORG.DASHBOARD;
    return redirect(request, dest);
  }

  return next();
}

// =============================================================================
// Matcher — runs the proxy on everything except API routes, Next internals
// and static assets. Keep the negative list tight; each addition weakens
// isolation.
// =============================================================================

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)",
  ],
};
