import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup/msw-server";

// =============================================================================
// /api/proxy/[...path] catch-all tests.
//
// Verifies the bearer attach + 401-refresh-and-retry behaviour that lives
// entirely server-side now.
// =============================================================================

const cookieJar = new Map<string, { value: string; options: unknown }>();

const cookiesMock = {
  get: vi.fn((name: string) => {
    const v = cookieJar.get(name);
    return v ? { name, value: v.value } : undefined;
  }),
  set: vi.fn((name: string, value: string, options?: unknown) => {
    cookieJar.set(name, { value, options });
  }),
  delete: vi.fn((name: string) => {
    cookieJar.delete(name);
  }),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookiesMock),
}));

vi.stubEnv("BACKEND_API_URL", "http://backend.test");

function seedSession(opts?: {
  accessToken?: string;
  refreshToken?: string;
}) {
  cookieJar.set("__Host-session", {
    value: JSON.stringify({
      accessToken: opts?.accessToken ?? "good-access",
      refreshToken: opts?.refreshToken ?? "good-refresh",
      userType: "org",
      user: { id: "u-1" },
    }),
    options: {},
  });
}

beforeEach(() => {
  cookieJar.clear();
  cookiesMock.get.mockClear();
  cookiesMock.set.mockClear();
  cookiesMock.delete.mockClear();
});

async function callProxy(
  method: "GET" | "POST",
  segments: string[],
  init?: RequestInit,
) {
  const route = await import("@/app/api/proxy/[...path]/route");
  const handler = method === "GET" ? route.GET : route.POST;
  const url = `http://localhost/api/proxy/${segments.join("/")}`;
  return handler(
    new Request(url, { method, ...init }) as never,
    { params: Promise.resolve({ path: segments }) } as never,
  );
}

describe("/api/proxy/[...path]", () => {
  it("attaches the bearer from the session cookie", async () => {
    seedSession({ accessToken: "abc-token" });

    let captured: string | null = null;
    server.use(
      http.get("http://backend.test/v1/things", ({ request }) => {
        captured = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    const res = await callProxy("GET", ["v1", "things"]);
    expect(res.status).toBe(200);
    expect(captured).toBe("Bearer abc-token");
  });

  it("on 401, refreshes the access token and retries once", async () => {
    seedSession({ accessToken: "expired", refreshToken: "good-refresh" });

    let attemptCount = 0;
    let refreshCalled = false;

    server.use(
      http.get("http://backend.test/v1/things", ({ request }) => {
        attemptCount += 1;
        if (request.headers.get("authorization") === "Bearer expired") {
          return HttpResponse.json({}, { status: 401 });
        }
        return HttpResponse.json({ data: "secret" });
      }),
      http.post("http://backend.test/auth/refresh", () => {
        refreshCalled = true;
        return HttpResponse.json({ access_token: "fresh-access" });
      }),
    );

    const res = await callProxy("GET", ["v1", "things"]);
    expect(res.status).toBe(200);
    expect(refreshCalled).toBe(true);
    expect(attemptCount).toBe(2);
    // Cookie has been re-saved with the new access token.
    const stored = JSON.parse(cookieJar.get("__Host-session")!.value);
    expect(stored.accessToken).toBe("fresh-access");
  });

  it("on refresh failure, clears the cookie and returns 401 to the caller", async () => {
    seedSession({ accessToken: "expired", refreshToken: "bad-refresh" });

    server.use(
      http.get("http://backend.test/v1/things", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post("http://backend.test/auth/refresh", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    const res = await callProxy("GET", ["v1", "things"]);
    expect(res.status).toBe(401);
    // The cookie is invalidated by writing an empty value with maxAge:0 + the
    // matching `__Host-` attributes — `cookies().delete()` alone doesn't
    // reliably expire prefixed cookies in every browser.
    const lastSet = cookiesMock.set.mock.calls.find(
      ([name]) => name === "__Host-session",
    );
    expect(lastSet).toBeTruthy();
    const [, value, opts] = lastSet!;
    expect(value).toBe("");
    expect((opts as { maxAge: number }).maxAge).toBe(0);
  });

  it("forwards calls without a session (auth-not-required endpoints)", async () => {
    let authHeader: string | null = "set-but-replaced-below";
    server.use(
      http.post("http://backend.test/auth/forgot-password", ({ request }) => {
        authHeader = request.headers.get("authorization");
        return HttpResponse.json({ message: "sent" });
      }),
    );

    const res = await callProxy("POST", ["auth", "forgot-password"], {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    });
    expect(res.status).toBe(200);
    expect(authHeader).toBeNull();
  });

  it("strips Set-Cookie from the upstream response", async () => {
    seedSession();
    server.use(
      http.get("http://backend.test/v1/things", () =>
        HttpResponse.json(
          { ok: true },
          {
            headers: {
              "set-cookie": "leaky=value; Path=/",
              "x-custom": "kept",
            },
          },
        ),
      ),
    );

    const res = await callProxy("GET", ["v1", "things"]);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("x-custom")).toBe("kept");
  });
});
