// =============================================================================
// Catch-all backend proxy.
//
// Every authenticated browser → backend call routes through this handler:
//
//   browser →  /api/proxy/v1/score-requests/stats?period=7d
//          →  this route reads the HttpOnly session cookie
//          →  forwards to BACKEND_API_URL/v1/score-requests/stats?period=7d
//          →  attaches Authorization: Bearer <accessToken>
//          →  on 401, calls /auth/refresh + retries once
//          →  streams the response back to the browser
//
// CORS goes away: the browser only ever talks to its own origin.
// Tokens never reach JavaScript.
// =============================================================================

import { NextResponse } from "next/server";
import {
  clearServerSession,
  getServerSession,
  updateServerAccessToken,
} from "@/lib/server-session";
import { BACKEND_API_URL } from "@/lib/server-config";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

// Inbound headers we explicitly drop before forwarding to the upstream.
// - `cookie`         : the browser's request carries our `__Host-session`
//                      cookie (~1.7 KB of JSON). The upstream doesn't need
//                      it — we attach the bearer token via Authorization
//                      ourselves — and shipping it on every call wastes
//                      bandwidth and leaks the session payload.
// - `authorization`  : if a stale Authorization arrives from the browser
//                      we don't want to honour it; we set our own below.
const DROP_INBOUND = new Set(["cookie", "authorization"]);

function copyHeaders(src: Headers): Headers {
  const out = new Headers();
  src.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (DROP_INBOUND.has(lower)) return;
    out.set(key, value);
  });
  return out;
}

function buildUpstreamUrl(
  pathSegments: string[],
  search: string,
): string {
  const path = pathSegments.map(encodeURIComponent).join("/");
  return `${BACKEND_API_URL}/${path}${search}`;
}

async function refreshAccessToken(): Promise<string | null> {
  const session = await getServerSession();
  if (!session) return null;

  const r = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
    cache: "no-store",
  });
  if (!r.ok) {
    await clearServerSession();
    return null;
  }
  const data = (await r.json()) as { access_token: string; expires_in?: number };
  const expiresAt = data.expires_in
    ? Date.now() + data.expires_in * 1000
    : undefined;
  await updateServerAccessToken(data.access_token, expiresAt);
  return data.access_token;
}

async function makeUpstream(
  url: string,
  init: RequestInit,
  accessToken: string | undefined,
): Promise<Response> {
  const headers = init.headers as Headers;
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  return fetch(url, { ...init, headers, cache: "no-store" });
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const search = new URL(request.url).search;
  const url = buildUpstreamUrl(path, search);

  const session = await getServerSession();
  // Auth-not-required endpoints (e.g. forgot-password) still flow through this
  // proxy; we forward without a bearer if there's no session.
  let accessToken = session?.accessToken;

  // Build the upstream request from the inbound one.
  const upstreamHeaders = copyHeaders(request.headers);
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
  const upstreamInit: RequestInit = {
    method: request.method,
    headers: upstreamHeaders,
    body,
  };

  let upstream = await makeUpstream(url, upstreamInit, accessToken);

  // 401 + we have a refresh token → try once.
  if (upstream.status === 401 && session?.refreshToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      accessToken = newToken;
      // Body has been consumed; re-create the init with a fresh body buffer.
      const retryInit: RequestInit = {
        method: request.method,
        headers: copyHeaders(request.headers),
        body,
      };
      upstream = await makeUpstream(url, retryInit, accessToken);
    } else {
      // Refresh failed → tell the browser the session is gone.
      return NextResponse.json(
        {
          error: {
            code: "AUTHENTICATION_ERROR",
            message: "Session expired. Please sign in again.",
          },
        },
        { status: 401 },
      );
    }
  }

  // Stream the upstream response straight back. We strip:
  //   - hop-by-hop headers (per RFC 7230)
  //   - Set-Cookie (don't bleed backend cookies into the browser)
  //   - Content-Encoding + Content-Length: Node's fetch implementation
  //     auto-decodes gzip/br/deflate when we read `upstream.body`, so the
  //     bytes we forward are already plain. Forwarding the original
  //     Content-Encoding header would make the browser try to decode plain
  //     JSON as gzip and fail with ERR_CONTENT_DECODING_FAILED. Similarly,
  //     the original Content-Length refers to the compressed payload.
  const SKIP = new Set([
    ...HOP_BY_HOP,
    "set-cookie",
    "content-encoding",
    "content-length",
  ]);
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (SKIP.has(key.toLowerCase())) return;
    responseHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
