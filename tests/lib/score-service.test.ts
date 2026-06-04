import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup/msw-server";
import { scoreService, SCORE_KEYS } from "@/lib/score-service";

// The api-client now points at /api/proxy on its own origin (the Next Route
// Handler attaches the bearer + handles 401 refresh server-side). Tests
// register MSW handlers under the same path.
const API = "http://localhost:3000/api/proxy";

describe("scoreService.getScoreRequests", () => {
  it("maps snake_case API rows to camelCase domain items", async () => {
    server.use(
      http.get(`${API}/v1/score-requests`, () =>
        HttpResponse.json({
          items: [
            {
              request_id: "req-1",
              tracking_id: "trk-1",
              organization_id: "org-1",
              reference_id: "ref-1",
              status: "completed",
              request_source: "single",
              applicant_name: "Ada Lovelace",
              score_value: 720,
              risk_category: "low",
              model_version: "v2",
              processing_time_ms: 850,
              created_at: "2026-04-20T12:00:00Z",
              scored_at: "2026-04-20T12:00:01Z",
              scoring_result: { decision: "APPROVE" },
              loan_amount: 5000,
              loan_purpose: "personal",
            },
          ],
          total: 1,
          page: 1,
          per_page: 10,
          total_pages: 1,
        }),
      ),
    );

    const result = await scoreService.getScoreRequests({ page: 1, perPage: 10 });

    expect(result.total).toBe(1);
    expect(result.perPage).toBe(10);
    expect(result.totalPages).toBe(1);

    const [row] = result.items;
    expect(row.id).toBe("req-1");
    expect(row.trackingId).toBe("trk-1");
    expect(row.organizationId).toBe("org-1");
    expect(row.applicantName).toBe("Ada Lovelace");
    expect(row.scoreValue).toBe(720);
    expect(row.riskCategory).toBe("low");
    expect(row.decision).toBe("APPROVE");
    expect(row.loanAmount).toBe(5000);
  });

  it("forwards a single decision filter as a string param", async () => {
    let capturedParams: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/v1/score-requests`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          per_page: 10,
          total_pages: 0,
        });
      }),
    );

    await scoreService.getScoreRequests({ decision: "REFER" });
    expect(capturedParams?.get("decision")).toBe("REFER");
  });

  it("serialises an array of decisions as repeated params per the BE spec", async () => {
    // The BE expects `?decision=REFER&decision=DECLINE` — NOT `?decision=REFER,DECLINE`.
    let capturedParams: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/v1/score-requests`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          per_page: 10,
          total_pages: 0,
        });
      }),
    );

    await scoreService.getScoreRequests({ decision: ["REFER", "DECLINE"] });
    expect(capturedParams?.getAll("decision")).toEqual(["REFER", "DECLINE"]);
  });

  it("omits an empty decision array from the wire", async () => {
    let capturedParams: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/v1/score-requests`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          per_page: 10,
          total_pages: 0,
        });
      }),
    );

    await scoreService.getScoreRequests({ decision: [] });
    expect(capturedParams?.has("decision")).toBe(false);
  });

  it("forwards search and status to the API", async () => {
    let capturedParams: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/v1/score-requests`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          per_page: 10,
          total_pages: 0,
        });
      }),
    );

    await scoreService.getScoreRequests({
      page: 2,
      perPage: 25,
      search: "Ada",
      status: "completed",
    });

    expect(capturedParams?.get("page")).toBe("2");
    expect(capturedParams?.get("per_page")).toBe("25");
    expect(capturedParams?.get("search")).toBe("Ada");
    expect(capturedParams?.get("status")).toBe("completed");
  });

  it("returns an empty list shape on no results", async () => {
    server.use(
      http.get(`${API}/v1/score-requests`, () =>
        HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          per_page: 10,
          total_pages: 0,
        }),
      ),
    );

    const result = await scoreService.getScoreRequests();
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("scoreService.getScoreRequestsStats", () => {
  it("passes period as a query param and returns the typed shape", async () => {
    let capturedParams: URLSearchParams | undefined;
    server.use(
      http.get(`${API}/v1/score-requests/stats`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams;
        return HttpResponse.json({
          period: "30d",
          generated_at: "2026-04-25T00:00:00Z",
          current: {
            total_requests: 184,
            decided: 171,
            avg_credit_score: 612,
            median_credit_score: 620,
            approval_rate_pct: 52.6,
            decision_counts: {
              APPROVE: 76,
              CONDITIONAL_APPROVE: 14,
              DECLINE: 61,
              REFER: 18,
              ERROR: 2,
              FRAUD_HOLD: 0,
            },
            score_distribution: [
              { range: "300-499", count: 12 },
              { range: "500-579", count: 33 },
              { range: "580-669", count: 59 },
              { range: "670-739", count: 47 },
              { range: "740-850", count: 20 },
            ],
          },
          previous: {
            total_requests: 163,
            decided: 150,
            avg_credit_score: 608,
            approval_rate_pct: 50.1,
          },
          trend: { total_delta_pct: 12.9, approval_delta_pp: 2.5, score_delta: 4 },
          needs_attention: { referred: 18, pending_or_processing: 3, failed: 1 },
        });
      }),
    );

    const stats = await scoreService.getScoreRequestsStats("30d");
    expect(capturedParams?.get("period")).toBe("30d");
    expect(stats.period).toBe("30d");
    expect(stats.current.total_requests).toBe(184);
    expect(stats.trend.total_delta_pct).toBe(12.9);
    expect(stats.needs_attention.referred).toBe(18);
  });

  it("preserves null trend values for empty previous windows", async () => {
    server.use(
      http.get(`${API}/v1/score-requests/stats`, () =>
        HttpResponse.json({
          period: "7d",
          generated_at: "2026-04-25T00:00:00Z",
          current: {
            total_requests: 5,
            decided: 4,
            avg_credit_score: 600,
            median_credit_score: 600,
            approval_rate_pct: 50,
            decision_counts: {
              APPROVE: 2,
              CONDITIONAL_APPROVE: 0,
              DECLINE: 2,
              REFER: 0,
              ERROR: 0,
              FRAUD_HOLD: 0,
            },
            score_distribution: [],
          },
          previous: {
            total_requests: 0,
            decided: 0,
            avg_credit_score: null,
            approval_rate_pct: 0,
          },
          trend: {
            total_delta_pct: null,
            approval_delta_pp: null,
            score_delta: null,
          },
          needs_attention: { referred: 0, pending_or_processing: 0, failed: 0 },
        }),
      ),
    );

    const stats = await scoreService.getScoreRequestsStats("7d");
    expect(stats.trend.total_delta_pct).toBeNull();
    expect(stats.trend.approval_delta_pp).toBeNull();
    expect(stats.trend.score_delta).toBeNull();
  });
});

describe("SCORE_KEYS factory", () => {
  it("produces stable key prefixes for invalidation", () => {
    expect(SCORE_KEYS.all[0]).toBe("score-requests");
    expect(SCORE_KEYS.lists()).toContain("list");
    expect(SCORE_KEYS.detail("abc")).toContain("abc");
    expect(SCORE_KEYS.stats("today")).toContain("today");
  });

  it("includes params in the list key for cache uniqueness", () => {
    const a = SCORE_KEYS.list({ page: 1 });
    const b = SCORE_KEYS.list({ page: 2 });
    expect(a).not.toEqual(b);
  });
});
