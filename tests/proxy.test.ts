import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const COOKIE_NAME = "__Host-session";

function buildSession(userType: "admin" | "org"): string {
  return JSON.stringify({
    accessToken: "a",
    refreshToken: "r",
    userType,
    user: { id: "u-1" },
  });
}

function makeRequest(
  path: string,
  options?: { session?: "admin" | "org" },
): NextRequest {
  const url = `http://app.test${path}`;
  const req = new NextRequest(new Request(url));
  if (options?.session) {
    req.cookies.set(COOKIE_NAME, buildSession(options.session));
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
    expect(res.status).not.toBe(307);
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
  it("treats malformed JSON as unauthenticated", () => {
    const url = "http://app.test/dashboard";
    const req = new NextRequest(new Request(url));
    req.cookies.set(COOKIE_NAME, "not-json{");
    const res = proxy(req);
    const loc = res.headers.get("location") || "";
    expect(res.status).toBe(307);
    expect(loc).toContain("/login");
  });
});
