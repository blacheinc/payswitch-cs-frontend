import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import CryptoJS from "crypto-js";
import { proxy } from "@/proxy";

// Source uses the same secret as the test setup stub.
const SECRET = "test-secret-for-vitest-only";

function buildSessionCookie(userType: "admin" | "org"): string {
  const payload = JSON.stringify({
    accessToken: "a",
    refreshToken: "r",
    userType,
    user: { id: "u-1" },
  });
  return CryptoJS.AES.encrypt(payload, SECRET).toString();
}

function makeRequest(
  path: string,
  options?: { session?: "admin" | "org" },
): NextRequest {
  const url = `http://app.test${path}`;
  const req = new NextRequest(new Request(url));
  if (options?.session) {
    // NextRequest cookies API auto-encodes when reading; we set the raw
    // ciphertext URL-encoded once so proxy.ts's `decodeURIComponent` recovers
    // the original ciphertext.
    const ciphertext = buildSessionCookie(options.session);
    req.cookies.set("session", encodeURIComponent(ciphertext));
  }
  return req;
}

describe("proxy — auth zone", () => {
  it("redirects an authenticated org user away from /login", () => {
    const res = proxy(makeRequest("/login", { session: "org" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("redirects an authenticated admin away from /admin-login", () => {
    const res = proxy(makeRequest("/admin-login", { session: "admin" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin-dashboard");
  });

  it("lets an unauthenticated user reach /login", () => {
    const res = proxy(makeRequest("/login"));
    // Allowed → no redirect / no rewrite.
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("proxy — admin zone", () => {
  it("redirects an unauthenticated request to /admin-login with ?next=", () => {
    const res = proxy(makeRequest("/admin-dashboard"));
    const loc = res.headers.get("location") || "";
    expect(res.status).toBe(307);
    expect(loc).toContain("/admin-login");
    expect(loc).toContain("next=");
  });

  it("rewrites org user → not-found for an admin path (no path leak)", () => {
    const res = proxy(makeRequest("/admin-dashboard", { session: "org" }));
    // A rewrite is a 200/304-class internal pointer; status is not 307.
    expect(res.status).not.toBe(307);
    // x-middleware-rewrite is set on internal rewrites.
    expect(res.headers.get("x-middleware-rewrite")).toContain("/_not-found");
  });

  it("lets an admin reach an admin path", () => {
    const res = proxy(makeRequest("/admin-dashboard", { session: "admin" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});

describe("proxy — org zone", () => {
  it("redirects an unauthenticated request to /login with ?next=", () => {
    const res = proxy(makeRequest("/dashboard"));
    const loc = res.headers.get("location") || "";
    expect(res.status).toBe(307);
    expect(loc).toContain("/login");
    expect(loc).toContain("next=");
  });

  it("rewrites admin user → not-found for an org path (no path leak)", () => {
    const res = proxy(makeRequest("/dashboard", { session: "admin" }));
    expect(res.status).not.toBe(307);
    expect(res.headers.get("x-middleware-rewrite")).toContain("/_not-found");
  });

  it("lets an org user reach an org path", () => {
    const res = proxy(makeRequest("/dashboard", { session: "org" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("proxy — root + public", () => {
  it("bounces an authenticated org user from / to /dashboard", () => {
    const res = proxy(makeRequest("/", { session: "org" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("bounces an authenticated admin from / to /admin-dashboard", () => {
    const res = proxy(makeRequest("/", { session: "admin" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin-dashboard");
  });

  it("lets an unauthenticated user reach /", () => {
    const res = proxy(makeRequest("/"));
    expect(res.status).toBe(200);
  });
});

describe("proxy — security headers", () => {
  it("sets the canonical security headers on every response", () => {
    const res = proxy(makeRequest("/dashboard", { session: "org" }));
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toContain("strict-origin");
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age");
    expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("preserves headers on a redirect response", () => {
    const res = proxy(makeRequest("/dashboard"));
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });
});

describe("proxy — invalid session cookie", () => {
  it("treats a tampered/garbage cookie as unauthenticated", () => {
    const url = "http://app.test/dashboard";
    const headers = new Headers();
    headers.set("cookie", "session=not-a-real-encrypted-value");
    const req = new NextRequest(new Request(url, { headers }));
    const res = proxy(req);
    const loc = res.headers.get("location") || "";
    expect(res.status).toBe(307);
    expect(loc).toContain("/login");
  });
});
