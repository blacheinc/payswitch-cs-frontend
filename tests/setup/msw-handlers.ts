import { http, HttpResponse } from "msw";

/**
 * Canonical happy-path handlers. Tests override per-case with `server.use(...)`.
 * Keep these minimal — they exist so unhandled requests don't fail the suite,
 * not as full fixtures.
 */
const API = "http://api.test/api";

export const defaultHandlers = [
  // ---------- Auth ----------
  http.post(`${API}/auth/login`, async () => {
    return HttpResponse.json({
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
      user: {
        id: "user-1",
        email: "user@org.com",
        name: "Test User",
        roleLabel: "User",
        permissions: ["score_requests.list"],
        organization: { id: "org-1", name: "Test Org", slug: "test-org" },
      },
      userType: "org",
    });
  }),

  http.post(`${API}/auth/refresh`, () =>
    HttpResponse.json({ access_token: "access-token-refreshed" }),
  ),

  http.get(`${API}/auth/me`, () =>
    HttpResponse.json({
      id: "user-1",
      email: "user@org.com",
      name: "Test User",
      roleLabel: "User",
      permissions: ["score_requests.list"],
      totp_enabled: false,
    }),
  ),

  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

  // ---------- Score requests ----------
  http.get(`${API}/v1/score-requests`, () =>
    HttpResponse.json({
      items: [],
      total: 0,
      page: 1,
      per_page: 10,
      total_pages: 0,
    }),
  ),

  http.get(`${API}/v1/score-requests/stats`, () =>
    HttpResponse.json({
      period: "7d",
      generated_at: "2026-04-25T00:00:00Z",
      current: {
        total_requests: 0,
        decided: 0,
        avg_credit_score: null,
        median_credit_score: null,
        approval_rate_pct: 0,
        decision_counts: {
          APPROVE: 0,
          CONDITIONAL_APPROVE: 0,
          DECLINE: 0,
          REFER: 0,
          ERROR: 0,
          FRAUD_HOLD: 0,
        },
        score_distribution: [
          { range: "300-499", count: 0 },
          { range: "500-579", count: 0 },
          { range: "580-669", count: 0 },
          { range: "670-739", count: 0 },
          { range: "740-850", count: 0 },
        ],
      },
      previous: {
        total_requests: 0,
        decided: 0,
        avg_credit_score: null,
        approval_rate_pct: 0,
      },
      trend: { total_delta_pct: null, approval_delta_pp: null, score_delta: null },
      needs_attention: { referred: 0, pending_or_processing: 0, failed: 0 },
    }),
  ),
];
