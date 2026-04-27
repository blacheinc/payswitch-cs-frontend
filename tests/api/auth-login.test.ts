import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup/msw-server";

// =============================================================================
// Tests for the /api/auth/login Route Handler.
//
// The handler proxies to the backend and, on success, sets the HttpOnly
// session cookie. We mock `next/headers` so cookie writes are observable.
// =============================================================================

const cookieJar = new Map<string, { value: string; options: unknown }>();

const cookiesMock = {
  get: vi.fn((name: string) => {
    const v = cookieJar.get(name);
    return v ? { name, value: v.value } : undefined;
  }),
  set: vi.fn(
    (name: string, value: string, options?: unknown) => {
      cookieJar.set(name, { value, options });
    },
  ),
  delete: vi.fn((name: string) => {
    cookieJar.delete(name);
  }),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookiesMock),
}));

// We must set this BEFORE the route module loads its top-level config.
vi.stubEnv("BACKEND_API_URL", "http://backend.test");

beforeEach(() => {
  cookieJar.clear();
  cookiesMock.get.mockClear();
  cookiesMock.set.mockClear();
  cookiesMock.delete.mockClear();
});

describe("POST /api/auth/login", () => {
  it("happy path: forwards credentials, sets HttpOnly cookie, returns user only", async () => {
    server.use(
      http.post("http://backend.test/auth/login", () =>
        HttpResponse.json({
          access_token: "ACCESS",
          refresh_token: "REFRESH",
          expires_in: 3600,
          user_type: "org",
        }),
      ),
      http.get("http://backend.test/auth/me", () =>
        HttpResponse.json({
          id: "u-1",
          email: "user@org.com",
          name: "Test",
          role: "User",
          status: "active",
          user_type: "org",
          organization_id: "org-1",
          permissions: ["score_requests.list"],
          created_at: "2026-04-01T00:00:00Z",
        }),
      ),
    );

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "user@org.com", password: "x" }),
      }),
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { user: { id: string }; userType: string };
    expect(json.user.id).toBe("u-1");
    expect(json.userType).toBe("org");
    // No tokens leaked to the browser response.
    expect(JSON.stringify(json)).not.toContain("ACCESS");
    expect(JSON.stringify(json)).not.toContain("REFRESH");

    // Cookie is set with HttpOnly + Secure + SameSite=Strict.
    expect(cookiesMock.set).toHaveBeenCalledOnce();
    const [name, value, opts] = cookiesMock.set.mock.calls[0];
    expect(name).toBe("__Host-session");
    const cookieValue = JSON.parse(value as string);
    expect(cookieValue.accessToken).toBe("ACCESS");
    expect(cookieValue.refreshToken).toBe("REFRESH");
    expect(cookieValue.userType).toBe("org");
    const cookieOpts = opts as Record<string, unknown>;
    expect(cookieOpts.httpOnly).toBe(true);
    expect(cookieOpts.sameSite).toBe("strict");
  });

  it("2FA branch: forwards requires_2fa + temp_token, does NOT set the cookie", async () => {
    server.use(
      http.post("http://backend.test/auth/login", () =>
        HttpResponse.json({
          access_token: "TEMP_TOKEN",
          requires_2fa: true,
          user_type: "org",
          email: "user@org.com",
        }),
      ),
    );

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "user@org.com", password: "x" }),
      }),
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      requires_2fa: boolean;
      temp_token: string;
    };
    expect(json.requires_2fa).toBe(true);
    expect(json.temp_token).toBe("TEMP_TOKEN");
    expect(cookiesMock.set).not.toHaveBeenCalled();
  });

  it("forwards backend errors with original status code", async () => {
    server.use(
      http.post("http://backend.test/auth/login", () =>
        HttpResponse.json(
          { error: { code: "INVALID_CREDENTIALS", message: "Bad creds" } },
          { status: 401 },
        ),
      ),
    );

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "x", password: "y" }),
      }),
    );

    expect(res.status).toBe(401);
    expect(cookiesMock.set).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON bodies with 400", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(res.status).toBe(400);
  });
});
