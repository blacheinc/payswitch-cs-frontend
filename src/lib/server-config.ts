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
