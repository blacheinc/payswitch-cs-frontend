import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup/msw-server";
import apiClient from "@/lib/api-client";

// =============================================================================
// The api-client now points at `/api/proxy` on its own origin. Bearer + 401
// refresh logic lives entirely in the Next Route Handler at
// src/app/api/proxy/[...path]/route.ts. The browser-side client therefore has
// only two responsibilities:
//   - send each call to /api/proxy/<path>
//   - normalize errors into the existing ApiError shape
// =============================================================================

// happy-dom doesn't supply an origin under which `/api/proxy/...` resolves.
// Stub it with localhost.
const ORIGIN = "http://localhost:3000";

describe("apiClient base URL", () => {
  it("targets the same-origin Next proxy route", () => {
    expect(apiClient.defaults.baseURL).toBe("/api/proxy");
  });

  it("forwards a GET to /api/proxy/<path>", async () => {
    let hit = false;
    server.use(
      http.get(`${ORIGIN}/api/proxy/v1/anything`, () => {
        hit = true;
        return HttpResponse.json({ ok: true });
      }),
    );

    const r = await apiClient.get("/v1/anything");
    expect(hit).toBe(true);
    expect(r.data.ok).toBe(true);
  });

  it("does NOT attach an Authorization header (server attaches it)", async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${ORIGIN}/api/proxy/v1/whoami`, ({ request }) => {
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient.get("/v1/whoami");
    expect(capturedAuth).toBeNull();
  });
});

describe("apiClient error normalization", () => {
  it("normalizes a FastAPI 422 validation envelope", async () => {
    server.use(
      http.post(`${ORIGIN}/api/proxy/v1/things`, () =>
        HttpResponse.json(
          {
            detail: [
              {
                loc: ["body", "email"],
                msg: "field required",
                type: "value_error",
              },
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
      const e = err as { code?: string; statusCode?: number };
      expect(e.code).toBe("VALIDATION_ERROR");
      expect(e.statusCode).toBe(422);
    }
  });

  it("normalizes a nested business-logic error envelope", async () => {
    server.use(
      http.get(`${ORIGIN}/api/proxy/v1/things`, () =>
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
      const e = err as { code?: string; statusCode?: number; message?: string };
      expect(e.code).toBe("AUTHORIZATION_ERROR");
      expect(e.statusCode).toBe(403);
      expect(e.message).toContain("Permission required");
    }
  });

  it("falls back to a status-based message when no body fields are present", async () => {
    server.use(
      http.get(`${ORIGIN}/api/proxy/v1/things`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );

    try {
      await apiClient.get("/v1/things");
      throw new Error("should have rejected");
    } catch (err) {
      const e = err as { code?: string; statusCode?: number; message?: string };
      expect(e.statusCode).toBe(500);
      expect(e.message?.toLowerCase()).toContain("internal server error");
    }
  });

  it("normalizes a network failure into a NETWORK_ERROR", async () => {
    server.use(
      http.get(`${ORIGIN}/api/proxy/v1/things`, () => HttpResponse.error()),
    );

    try {
      await apiClient.get("/v1/things");
      throw new Error("should have rejected");
    } catch (err) {
      const e = err as { code?: string; statusCode?: number };
      expect(e.statusCode).toBe(0);
      expect(e.code).toMatch(/NETWORK|ERR_NETWORK|ECONNREFUSED|ECONNABORTED/);
    }
  });
});
