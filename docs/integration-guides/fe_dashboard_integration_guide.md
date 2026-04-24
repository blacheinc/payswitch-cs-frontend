# Frontend Integration Guide — Dashboard Endpoints

> **Companion** to [`fe_monitoring_integration_guide.md`](./fe_monitoring_integration_guide.md) (admin overview dashboard) and the existing list/scoring endpoints. This guide documents the three backend changes landed for the overview dashboards per the FE requirements doc.

---

## Summary of changes

| # | Endpoint | Type | Priority |
|---|---|---|---|
| 1 | `GET /v1/score-requests/stats` | 🆕 New | 🔴 High |
| 2 | `GET /v1/score-requests?decision=` | ⚠️ Extended | 🟡 Medium |
| 3 | `GET /v1/monitoring/model-ops` — `promoted_at` added | ⚠️ Field | 🟢 Low |

Everything else on the original punch-list already existed — see §4 of the requirements doc for the unchanged admin overview endpoints.

---

## 1. `GET /v1/score-requests/stats` — Organization dashboard stats

Aggregated counts, decision mix, score distribution, previous-period comparison, trend deltas, and action-queue counts in a single call. Replaces the old "fetch 200 rows and aggregate client-side" pattern.

### Request

```http
GET /v1/score-requests/stats?period=today
Authorization: Bearer <org-jwt | api-key>
```

**Query params**

| Param | Required | Values | Notes |
|---|---|---|---|
| `period` | ✅ | `today` · `7d` · `30d` · `90d` | Window anchored at "now" (UTC). `today` is from 00:00 UTC to now; other values are rolling. |

**Permission**: `score_requests.list` (same gate as the list endpoint).

### Response `200`

```json
{
  "period": "7d",
  "generated_at": "2026-04-24T15:04:20.269477Z",
  "current": {
    "total_requests": 184,
    "decided": 171,
    "avg_credit_score": 612,
    "median_credit_score": 620,
    "approval_rate_pct": 52.6,
    "decision_counts": {
      "APPROVE": 76,
      "CONDITIONAL_APPROVE": 14,
      "DECLINE": 61,
      "REFER": 18,
      "ERROR": 2,
      "FRAUD_HOLD": 0
    },
    "score_distribution": [
      { "range": "300-499", "count": 12 },
      { "range": "500-579", "count": 33 },
      { "range": "580-669", "count": 59 },
      { "range": "670-739", "count": 47 },
      { "range": "740-850", "count": 20 }
    ]
  },
  "previous": {
    "total_requests": 163,
    "decided": 150,
    "avg_credit_score": 608,
    "approval_rate_pct": 50.1
  },
  "trend": {
    "total_delta_pct": 12.9,
    "approval_delta_pp": 2.5,
    "score_delta": 4
  },
  "needs_attention": {
    "referred": 18,
    "pending_or_processing": 3,
    "failed": 1
  }
}
```

### Field reference

| Path | Type | Meaning |
|---|---|---|
| `period` | string | Echoed query value, for UI captions. |
| `generated_at` | ISO-8601 | Server timestamp, UTC. Use for "updated N seconds ago". |
| `current.total_requests` | int | All ScoreRequests created in the window. Includes those still in flight or failed. |
| `current.decided` | int | Subset with a persisted `ScoringResult`. |
| `current.avg_credit_score` | int \| null | Average of `score_value` across decided rows that have a score. `null` when no row has one. |
| `current.median_credit_score` | int \| null | Same basis, median. `null` on empty. |
| `current.approval_rate_pct` | float | `(APPROVE + CONDITIONAL_APPROVE) / decided * 100`. Rounded to 1 dp. `0.0` when `decided == 0`. |
| `current.decision_counts` | object | Integer counts for every `ScoringDecision` enum value. Missing values are `0`. |
| `current.score_distribution` | list | Five fixed FICO-style buckets (300-499, 500-579, 580-669, 670-739, 740-850). Always returned in order; zero-count buckets are included. Only rows with a non-null `score_value` are counted. |
| `previous.*` | mixed | Same-length window immediately before `current`. E.g. `period=7d` → previous is the 7 days ending at `current_start`. |
| `trend.total_delta_pct` | float \| null | % change in total requests vs previous window. `null` when previous had zero requests. |
| `trend.approval_delta_pp` | float \| null | Percentage-point change in `approval_rate_pct`. `null` when previous had no decided rows. |
| `trend.score_delta` | int \| null | Integer delta in `avg_credit_score`. `null` when either window has no scored rows. |
| `needs_attention.referred` | int | Count of `REFER` decisions in the current window. |
| `needs_attention.pending_or_processing` | int | **Instantaneous** count, not window-scoped. In-flight work across all time. |
| `needs_attention.failed` | int | `ScoreRequestStatus == FAILED` in the current window. |

### Conventions (match requirements doc §4.3)

- Percentages on a 0–100 scale, `_pct` suffix.
- Percentage-point deltas use `_delta_pp`.
- Percentage-change deltas use `_delta_pct`.
- `null` on trend fields is a deliberate signal — render nothing rather than "↑ 0%".

### Empty state

Zero requests in the window → every count is `0`, avg/median are `null`, `approval_rate_pct: 0.0`, `decision_counts` has all zeros, `score_distribution` has five zero-count buckets. **Never 404.**

### Errors

- `422` — invalid `period` value (regex enforces `today|7d|30d|90d`).
- `401` / `403` — standard auth/permission envelope (see [org RBAC guide](./fe_rbac_integration_guide.md#error-responses)).

### Performance notes

The endpoint runs 2 aggregate queries (current + previous window) plus 2 instantaneous counts for `needs_attention`. All are `GROUP BY` or simple counts on indexed columns (`organization_id`, `created_at`, `status`, `decision`). Safe to poll at the intervals in §4 below.

---

## 2. `GET /v1/score-requests` — extended filters

The existing list endpoint now supports filtering by scoring decision and confirms the pre-existing status filter for the `pending | processing | completed | failed` values.

### Query params added / confirmed

| Param | New? | Values |
|---|---|---|
| `status` | confirmed | `pending` · `processing` · `completed` · `failed` |
| `decision` | 🆕 | `APPROVE` · `CONDITIONAL_APPROVE` · `DECLINE` · `REFER` · `FRAUD_HOLD` · `ERROR`. Repeatable (`?decision=REFER&decision=DECLINE`) **or** comma-separated (`?decision=REFER,DECLINE`) — both are supported. |
| `per_page` | confirmed | 1–100. |

**Semantics:** `status` filters on `ScoreRequest.status` (lifecycle state, set pre-scoring). `decision` joins to `ScoringResult.decision` — requests that never produced a result are excluded when `decision=` is active. Combine both filters freely.

### Examples

```http
# Referral queue — top 6 for the action-queue card
GET /v1/score-requests?decision=REFER&per_page=6&page=1

# Everything that couldn't be scored (pipeline failures)
GET /v1/score-requests?status=failed&per_page=10

# Multi-decision — approved or conditionally approved
GET /v1/score-requests?decision=APPROVE,CONDITIONAL_APPROVE&per_page=20
```

### Errors

- `422` — invalid `status` or `decision` value. The error body lists the allowed set.

### Response shape

Unchanged — same `PaginatedResponse<ScoreRequestSummary>` as before.

---

## 3. `GET /v1/monitoring/model-ops` — `promoted_at` on champions

Each entry in `champions[]` now carries a `promoted_at` timestamp (nullable) distinct from `created_at`.

### Response shape (`champions[]`)

```json
{
  "champions": [
    {
      "model_type": "credit_risk",
      "registry_name": "credit-risk-champion",
      "version": "3",
      "status": "REGISTERED",
      "created_at": "2026-04-10T14:30:00Z",
      "promoted_at": "2026-04-12T09:15:00Z",
      "current_metrics": { "auc": 0.847, "f1": 0.782 },
      "live_auc": 0.847,
      "auc_change_pct": 0.0,
      "auc_alert": false
    }
  ]
}
```

**When `promoted_at` is populated:** the ML team's `ModelVersion` row for this `(model_type, version)` has a promoted timestamp. Most existing rows in the DB won't have one yet — treat the field as optional and fall back to `created_at` with "Deployed {date}" if `promoted_at` is `null`.

**FE label recommendation:**

```tsx
const label = champion.promoted_at
  ? `Promoted ${formatDate(champion.promoted_at)}`
  : `Deployed ${formatDate(champion.created_at)}`;
```

---

## 4. Polling cadences (reaffirmed)

Unchanged from the requirements doc:

| Data | Interval | Notes |
|---|---|---|
| `/v1/score-requests/stats?period=today` | 60 s | |
| `/v1/score-requests/stats?period=7d\|30d\|90d` | 5 min | |
| `/v1/score/batch` list | 10 s while any active job exists, else paused | |
| Action queue (`/v1/score-requests?decision=REFER&per_page=6`) | On tab focus + after mutations | Not time-polled |

All endpoints use the same caching + rate-limit headers as the rest of the API.

---

## 5. TypeScript interfaces

```typescript
// ── GET /v1/score-requests/stats ────────────────────────────────────

export type ScoreDashboardPeriod = 'today' | '7d' | '30d' | '90d';

export interface ScoreDistributionBucket {
  range: '300-499' | '500-579' | '580-669' | '670-739' | '740-850';
  count: number;
}

export interface StatsDecisionCounts {
  APPROVE: number;
  CONDITIONAL_APPROVE: number;
  DECLINE: number;
  REFER: number;
  ERROR: number;
  FRAUD_HOLD: number;
}

export interface StatsCurrent {
  total_requests: number;
  decided: number;
  avg_credit_score: number | null;
  median_credit_score: number | null;
  approval_rate_pct: number;
  decision_counts: StatsDecisionCounts;
  score_distribution: ScoreDistributionBucket[];
}

export interface StatsPrevious {
  total_requests: number;
  decided: number;
  avg_credit_score: number | null;
  approval_rate_pct: number;
}

export interface StatsTrend {
  total_delta_pct: number | null;
  approval_delta_pp: number | null;
  score_delta: number | null;
}

export interface StatsNeedsAttention {
  referred: number;
  pending_or_processing: number;
  failed: number;
}

export interface ScoreRequestStatsResponse {
  period: ScoreDashboardPeriod;
  generated_at: string;            // ISO-8601
  current: StatsCurrent;
  previous: StatsPrevious;
  trend: StatsTrend;
  needs_attention: StatsNeedsAttention;
}

// ── GET /v1/score-requests — extended filter params ─────────────────

export type ScoreDecision =
  | 'APPROVE'
  | 'CONDITIONAL_APPROVE'
  | 'DECLINE'
  | 'REFER'
  | 'FRAUD_HOLD'
  | 'ERROR';

export type ScoreRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ListScoreRequestsParams {
  page?: number;
  per_page?: number;                        // 1–100
  status?: ScoreRequestStatus;
  decision?: ScoreDecision[] | ScoreDecision; // repeat or comma-separated
}

// ── GET /v1/monitoring/model-ops — champion additions ──────────────

export interface Champion {
  model_type: string;
  registry_name: string;
  version: string;
  status: string;
  created_at: string | null;
  promoted_at: string | null;  // 🆕
  current_metrics: Record<string, number>;
  live_auc: number | null;
  auc_change_pct: number | null;
  auc_alert: boolean | null;
}
```

---

## 6. React Query examples

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Dashboard stats — adjust refetchInterval by period
export function useScoreRequestStats(period: ScoreDashboardPeriod) {
  return useQuery<ScoreRequestStatsResponse>({
    queryKey: ['score-requests', 'stats', period],
    queryFn: () =>
      api.get(`/v1/score-requests/stats?period=${period}`).then((r) => r.data),
    refetchInterval: period === 'today' ? 60_000 : 5 * 60_000,
    staleTime: period === 'today' ? 30_000 : 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// Action queue (referral review)
export function useReferralQueue(pageSize = 6) {
  return useQuery({
    queryKey: ['score-requests', 'decision', 'REFER', pageSize],
    queryFn: () =>
      api
        .get('/v1/score-requests', {
          params: { decision: 'REFER', per_page: pageSize },
        })
        .then((r) => r.data),
    enabled: true,
    staleTime: 60_000,
    refetchOnWindowFocus: true, // this one *does* refetch on focus
  });
}
```

---

## 7. Migration / cut-over

The old "fetch 200 rows and aggregate client-side" path should be removed once the FE integrates the stats endpoint. The feature flag `NEXT_PUBLIC_USE_SCORE_STATS_ENDPOINT` is a clean gate:

```tsx
const useStats = process.env.NEXT_PUBLIC_USE_SCORE_STATS_ENDPOINT === 'true';

const stats = useStats
  ? useScoreRequestStats(period)
  : useLegacyClientSideAggregation(period); // existing code
```

After FE deploys confirm stats are correct, remove the legacy branch.

---

## 8. Errors (consistent with cross-cutting §4.2)

```json
// 403 — missing score_requests.list permission
{ "error": { "code": "AUTHORIZATION_ERROR", "message": "Permission required: score_requests.list", "details": {} } }

// 422 — bad period / status / decision
{ "detail": [{ "loc": ["query", "period"], "msg": "String should match pattern '^(today|7d|30d|90d)$'", "type": "string_pattern_mismatch" }] }
```

Fallback to zeros is fine on 403 (matches the FE's existing pattern for monitoring tiles). Never render a stale number — on any 4xx show the empty state.
