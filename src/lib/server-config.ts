// =============================================================================
// Server-only runtime configuration.
//
// `BACKEND_API_URL` is the upstream backend's base URL — server-only because
// the browser only ever talks to /api/* on this Next app.
// =============================================================================

import "server-only";

const RAW_BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://localhost:3001";

/** Backend base URL with no trailing slash. */
export const BACKEND_API_URL = RAW_BACKEND_API_URL.replace(/\/+$/, "");

/**
 * This application's own public base URL, e.g. `https://payswitch-cs.vercel.app`.
 *
 * Origin for links the backend emails (reset, invites) — see callback-url.ts.
 *
 * MUST match the backend's DASHBOARD_BASE_URL exactly; it rejects mismatches
 * silently. Leave unset on previews and locally — the proxy then omits the
 * callback and the backend uses its own. Server-only, read at runtime.
 */
const RAW_APP_BASE_URL = process.env.APP_BASE_URL || "";

/** App base URL with no trailing slash; empty string when not configured. */
export const APP_BASE_URL = RAW_APP_BASE_URL.replace(/\/+$/, "");

// =============================================================================
// Connection pre-warm
//
// Cold-start observation: the very first proxy call after server boot pays a
// ~150–200 ms TLS handshake + connection-establish cost to the upstream. Every
// subsequent call reuses the connection via undici's keep-alive pool (Node's
// default fetch dispatcher) and is much faster.
//
// We trigger one cheap request at module load so that, by the time the first
// user request arrives, the TCP+TLS connection to the backend is already warm
// in the pool.
//
// Environment-agnostic notes:
//   - We use `HEAD /` so the pre-warm doesn't depend on any specific path
//     (`/health`, `/ready`, etc.) being exposed by whichever backend the
//     deployment points at. Many gateways respond 404 / 405 to a root HEAD —
//     **that's fine**. What we care about is the TCP+TLS handshake, which
//     completes regardless of the HTTP status.
//   - Failures are silently swallowed: pre-warm is purely an optimisation.
//     If the backend is offline at boot or doesn't accept HEAD at all, the
//     proxy still works on demand.
//   - The short timeout keeps a slow/offline backend from holding any
//     resources on the Next process.
// =============================================================================

if (typeof globalThis.fetch === "function") {
  void fetch(BACKEND_API_URL, {
    method: "HEAD",
    cache: "no-store",
    signal: AbortSignal.timeout(2000),
  }).catch(() => {
    // Intentionally swallowed — pre-warm is best-effort.
  });
}
