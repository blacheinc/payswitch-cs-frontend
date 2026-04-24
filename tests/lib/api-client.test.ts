import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup/msw-server";
import apiClient from "@/lib/api-client";
import { saveSession, getAccessToken } from "@/lib/session-storage";
import type { User } from "@/types/models";

const API = "http://api.test/api";

const seedUser = {
  id: "u-1",
  email: "user@example.com",
  name: "Test",
  permissions: ["score_requests.list"],
} as unknown as User;

function seedSession(opts?: { accessToken?: string; refreshToken?: string }) {
  saveSession({
    accessToken: opts?.accessToken ?? "expired-jwt",
    refreshToken: opts?.refreshToken ?? "refresh-jwt",
    userType: "org",
    user: seedUser,
  });
}

describe("apiClient request interceptor", () => {
  it("attaches the bearer token from session-storage", async () => {
    seedSession({ accessToken: "abc-token" });
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${API}/v1/anything`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient.get("/v1/anything");
    expect(capturedAuth).toBe("Bearer abc-token");
  });

  it("does not attach a header when no session exists", async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${API}/v1/public`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient.get("/v1/public");
    expect(capturedAuth).toBeNull();
  });
});

describe("apiClient 401 refresh flow", () => {
  it("refreshes the access token on 401 and retries the original request", async () => {
    seedSession({ accessToken: "expired", refreshToken: "good-refresh" });

    let attemptCount = 0;
    let refreshCalled = false;
    let refreshBody: { refresh_token?: string } | undefined;

    server.use(
      http.get(`${API}/v1/protected`, ({ request }) => {
        attemptCount += 1;
        const auth = request.headers.get("authorization");
        if (auth === "Bearer expired") {
          return HttpResponse.json({ error: "expired" }, { status: 401 });
        }
        return HttpResponse.json({ data: "secret", attemptCount });
      }),
      http.post(`${API}/auth/refresh`, async ({ request }) => {
        refreshCalled = true;
        refreshBody = (await request.json()) as { refresh_token?: string };
        return HttpResponse.json({ access_token: "new-access" });
      }),
    );

    const response = await apiClient.get("/v1/protected");
    expect(refreshCalled).toBe(true);
    expect(refreshBody?.refresh_token).toBe("good-refresh");
    expect(attemptCount).toBe(2);
    expect(response.data.data).toBe("secret");
    expect(getAccessToken()).toBe("new-access");
  });

  it("clears session and redirects when refresh fails", async () => {
    seedSession({ accessToken: "expired", refreshToken: "bad-refresh" });

    server.use(
      http.get(`${API}/v1/protected`, () =>
        HttpResponse.json({ error: "expired" }, { status: 401 }),
      ),
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ error: "invalid" }, { status: 401 }),
      ),
    );

    await expect(apiClient.get("/v1/protected")).rejects.toBeDefined();
    // The interceptor reads tokens via getRefreshToken at the moment of 401;
    // after a failed refresh the session must be cleared.
    expect(getAccessToken()).toBeNull();
  });

  it("clears session immediately when no refresh token is stored", async () => {
    saveSession({
      accessToken: "expired",
      refreshToken: "",
      userType: "org",
      user: seedUser,
    });

    server.use(
      http.get(`${API}/v1/protected`, () =>
        HttpResponse.json({ error: "expired" }, { status: 401 }),
      ),
    );

    await expect(apiClient.get("/v1/protected")).rejects.toBeDefined();
    expect(getAccessToken()).toBeNull();
  });

  it("does not attempt refresh on 401 from /auth/* endpoints", async () => {
    seedSession();
    let refreshCalled = false;
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ error: "bad creds" }, { status: 401 }),
      ),
      http.post(`${API}/auth/refresh`, () => {
        refreshCalled = true;
        return HttpResponse.json({ access_token: "should-not-happen" });
      }),
    );

    await expect(apiClient.post("/auth/login", { email: "x", password: "y" })).rejects.toBeDefined();
    expect(refreshCalled).toBe(false);
  });
});

describe("apiClient error normalization", () => {
  it("normalizes a FastAPI 422 validation envelope", async () => {
    server.use(
      http.post(`${API}/v1/things`, () =>
        HttpResponse.json(
          {
            detail: [
              { loc: ["body", "email"], msg: "field required", type: "value_error" },
            ],
          },
          { status: 422 },
        ),
      ),
    );

    try {
      await apiClient.post("/v1/things", {});
      throw new Error("should have rejected");
    } catch (err) {
      const apiError = err as { code?: string; statusCode?: number; details?: unknown };
      expect(apiError.code).toBe("VALIDATION_ERROR");
      expect(apiError.statusCode).toBe(422);
      expect(apiError.details).toBeDefined();
    }
  });

  it("normalizes a nested business-logic error envelope", async () => {
    server.use(
      http.get(`${API}/v1/things`, () =>
        HttpResponse.json(
          {
            error: {
              code: "AUTHORIZATION_ERROR",
              message: "Permission required: score_requests.list",
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );

    try {
      await apiClient.get("/v1/things");
      throw new Error("should have rejected");
    } catch (err) {
      const apiError = err as { code?: string; statusCode?: number; message?: string };
      expect(apiError.code).toBe("AUTHORIZATION_ERROR");
      expect(apiError.statusCode).toBe(403);
      expect(apiError.message).toContain("Permission required");
    }
  });

  it("falls back to a status-based message when no body fields are present", async () => {
    server.use(
      http.get(`${API}/v1/things`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    try {
      await apiClient.get("/v1/things");
      throw new Error("should have rejected");
    } catch (err) {
      const apiError = err as { code?: string; statusCode?: number; message?: string };
      expect(apiError.statusCode).toBe(500);
      expect(apiError.message?.toLowerCase()).toContain("internal server error");
    }
  });

  it("normalizes a network failure into a NETWORK_ERROR", async () => {
    server.use(
      http.get(`${API}/v1/things`, () => HttpResponse.error()),
    );

    try {
      await apiClient.get("/v1/things");
      throw new Error("should have rejected");
    } catch (err) {
      const apiError = err as { code?: string; statusCode?: number };
      expect(apiError.statusCode).toBe(0);
      expect(apiError.code).toMatch(/NETWORK|ERR_NETWORK|ECONNREFUSED|ECONNABORTED/);
    }
  });
});
