import { http, HttpResponse } from "msw";

/**
 * Canonical happy-path handlers. Tests override per-case with `server.use(...)`.
 * Keep these minimal — they exist so unhandled requests don't fail the suite,
 * not as full fixtures.
 *
 * The api-client now targets `/api/proxy` on its own origin (the Next Route
 * Handler attaches the bearer + handles 401 refresh server-side). The
 * `/api/auth/*` endpoints are direct Next routes, not proxied.
 */
const ORIGIN = "http://localhost:3000";
const API = `${ORIGIN}/api/proxy`;
const AUTH = `${ORIGIN}/api/auth`;

export const defaultHandlers = [
  // ---------- Auth (Next Route Handlers, NOT proxied) ----------
  http.post(`${AUTH}/login`, () =>
    HttpResponse.json({
      user: {
        id: "user-1",
        email: "user@org.com",
        name: "Test User",
        roleLabel: "User",
        permissions: ["score_requests.list"],
        organization: { id: "org-1", name: "Test Org", slug: "test-org" },
      },
      userType: "org",
    }),
  ),

  http.post(`${AUTH}/refresh`, () => HttpResponse.json({ ok: true })),

  http.get(`${AUTH}/me`, () =>
    HttpResponse.json({
      user: {
        id: "user-1",
        email: "user@org.com",
        name: "Test User",
        roleLabel: "User",
        permissions: ["score_requests.list"],
      },
      userType: "org",
    }),
  ),

  http.post(`${AUTH}/logout`, () =>
    HttpResponse.json({ message: "ok" }, { status: 200 }),
  ),

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
