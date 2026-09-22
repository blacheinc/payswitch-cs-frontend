// Emailed links (reset, invites) are built from `callback_url` in the request
// body. A browser-supplied value is a token delivery vector — VAPT §2.2 — so
// the proxy overwrites it. Defence in depth; the backend owns the real allow-list.

import "server-only";
import { APP_BASE_URL } from "@/lib/server-config";
import { ROUTES } from "@/lib/constant";

/** Routes an emailed link may land on. Anything else falls back to the default. */
const ALLOWED_CALLBACK_PATHS: ReadonlySet<string> = new Set([
  ROUTES.AUTH.RESET_PASSWORD,
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.ADMIN_LOGIN,
]);

const DEFAULT_CALLBACK_PATH = ROUTES.AUTH.LOGIN;

/**
 * No host/URL fallback on purpose: the backend rejects unknown callbacks
 * silently, so a derived origin (every preview host) would quietly point at
 * production. Empty means "send nothing".
 */
export function resolveAppOrigin(): string {
  return APP_BASE_URL;
}

/** Rebuild from a trusted origin. Only an allow-listed pathname survives. */
export function sanitizeCallbackUrl(raw: unknown, origin: string): string {
  let path: string = DEFAULT_CALLBACK_PATH;

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = new URL(raw.trim(), origin || "https://placeholder.invalid");
      if (ALLOWED_CALLBACK_PATHS.has(parsed.pathname)) {
        path = parsed.pathname;
      }
    } catch {
      // Unparseable → default. Never propagate the caller's value.
    }
  }

  return `${origin}${path}`;
}

/**
 * Rewrite `callback_url` in a proxied JSON body; everything else passes
 * through. Keyed on body shape so new endpoints are covered without a list.
 */
export function rewriteCallbackUrlInBody(
  body: ArrayBuffer | undefined,
  request: Request,
): ArrayBuffer | undefined {
  if (!body || body.byteLength === 0) return body;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return body;

  let text: string;
  try {
    text = new TextDecoder().decode(body);
  } catch {
    return body;
  }
  if (!text.includes("callback_url")) return body;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return body;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return body;
  }

  const payload = parsed as Record<string, unknown>;
  if (!("callback_url" in payload)) return body;

  const origin = resolveAppOrigin();
  // Unconfigured → drop the field; the backend uses its own DASHBOARD_BASE_URL.
  if (!origin) {
    delete payload.callback_url;
  } else {
    payload.callback_url = sanitizeCallbackUrl(payload.callback_url, origin);
  }

  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  ) as ArrayBuffer;
}
