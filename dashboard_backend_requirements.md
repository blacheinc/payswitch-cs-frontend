# Dashboard Overview — Backend Integration Requirements

> **Audience**: Backend engineers building endpoints the overview dashboards consume.
> **Scope**: The **Admin Platform Overview** (`/admin-dashboard`) and the **Organization Dashboard** (`/dashboard`).
> **Status key**: ✅ endpoint exists and is used as-is · ⚠️ endpoint exists but needs a change · 🆕 endpoint must be created.

---

## 1. Executive summary

| Dashboard | Endpoints it needs | New work required |
|---|---|---|
| Admin Platform Overview | Existing `/v1/monitoring/*` + `/v1/models/current` | **None** — already wired |
| Organization Dashboard | `/v1/score-requests`, `/v1/score/batch`, `/auth/me` + **new** stats endpoint | **One new endpoint** (`/v1/score-requests/stats`) plus a small filter extension on `/v1/score-requests` |

If you only have budget for one item on this list, prioritise **§3.2 `GET /v1/score-requests/stats`** — that's what unblocks accurate org-side KPIs at any data volume.

---

## 2. Admin Platform Overview (`/admin-dashboard`)

Audience: platform admins. All endpoints are already documented in `fe_monitoring_integration_guide.md`. The overview is a thin aggregation of four of those endpoints.

### 2.1 Endpoints consumed — no changes needed

| Tile / card | Endpoint | Notes |
|---|---|---|
| **KPI · Requests** (total + error rate) | `GET /v1/monitoring/infrastructure?period=1h\|6h\|24h\|7d\|30d` | ✅ Uses `request_volume.total`, `error_rates.overall_pct`. |
| **KPI · Approval rate** (+ decline-rate subtitle, decisions count) | `GET /v1/monitoring/risk?period=24h\|7d\|30d\|90d` | ✅ Uses `approval_rates.overall.{total_decisions, approve_rate_pct, decline_rate_pct}`. |
| **KPI · Response time (P99)** | Same infra call | ✅ Uses `latency.p99_ms`. Turns red when ≥ 1000 ms. |
| **KPI · Model accuracy** | `GET /v1/monitoring/model-ops?period=7d\|30d\|90d` | ✅ Uses the first champion in `champions[]`, preferring `model_type === "credit_risk"`. Reads `live_auc` (falls back to `current_metrics.auc`), `auc_change_pct`, `auc_alert`. |
| **Firing-alerts banner + health pill** | `GET /v1/monitoring/alerts?status=firing&limit=5` | ✅ Uses `summary.{total_firing, critical_firing}` and up to 3 rows from `alerts[]`. |
| **Traffic chart** (requests / errors / P99 over time) | Infra endpoint `timeseries[]` | ✅ Expects `{bucket, requests, errors, p99_ms}`. |
| **Decisions card** (stacked bar + counts) | Risk endpoint `approval_rates.overall` | ✅ Uses `{approve, conditional_approve, decline, refer, error}`. |
| **Champion-models strip** (4 tiles) | Model-ops endpoint `champions[]` | ✅ One tile per model type; shows AUC, delta %, health pill. |

### 2.2 Polling (what the FE does)

| Data | Interval | Driver |
|---|---|---|
| Infrastructure | 60 s | per integration guide |
| Risk | 5 min | per integration guide |
| Model-ops | 10 min | per integration guide |
| Alerts (banner) | 60 s | per integration guide |

The FE uses TanStack Query `refetchInterval` and never polls when the tab is hidden (`refetchOnWindowFocus: false`). Each endpoint should be **cheap under 60 s polling for all admin users combined** — please budget for that when thinking about caching / DB pressure.

### 2.3 One small nice-to-have

The champion-models strip displays the `created_at` timestamp as "Deployed {date}" but only when the client doesn't already know the model is healthy. If you can include a short **`promoted_at`** distinct from `created_at` in the model-ops `champions[]` response, the FE can label it "Promoted {date}" which is more accurate. Low-priority polish.

---

## 3. Organization Dashboard (`/dashboard`)

Audience: any org user. The overview shows scoring activity over a selectable period (Today / 7d / 30d), a decision-mix breakdown, a score-spread histogram, active batch jobs, and an action queue.

### 3.1 What the FE consumes today

| Tile / card | Endpoint | Status |
|---|---|---|
| Hero greeting | `GET /auth/me` | ✅ Existing; we use `name` |
| Active batch jobs card | `GET /v1/score/batch?page=1&page_size=10` | ✅ Existing; filter client-side to `queued` / `processing` |
| Period-KPIs, Outcome mix, Score spread, Action queue | `GET /v1/score-requests?page=1&per_page=200` | ⚠️ **This is the problem.** See §3.2. |

### 3.2 🆕 NEW endpoint — `GET /v1/score-requests/stats`

**Why**: the FE currently fetches the 200 most-recent score requests and computes KPIs + decision mix + score histogram + "vs previous period" trend deltas client-side. That works for small orgs but silently misreports numbers for any org doing > 200 requests in the selected window. We need the server to aggregate.

#### Request

```http
GET /v1/score-requests/stats?period=today|7d|30d
Authorization: Bearer <org-jwt | api-key>
```

**Query params**

| Param | Required | Values | Notes |
|---|---|---|---|
| `period` | ✅ | `today` · `7d` · `30d` · (optional `90d`) | Window anchored at "now" |

`today` = from start of today in the org's configured timezone (UTC if unknown) to now. `7d`, `30d`, `90d` = rolling windows.

**Permission**: `score_requests.list` (same gate as the list endpoint).

#### Response `200`

```json
{
  "period": "7d",
  "generated_at": "2026-04-24T11:22:33Z",

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
      "ERROR": 2
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

**Notes on each field**

- `period` / `generated_at` — echoed so the UI can caption "last 7 days · updated …".
- `current.decision_counts` — the 5 outcome buckets. `ERROR` = pipeline failed (maps to our "Could not score" bar).
- `current.score_distribution` — use exactly these five buckets (they are standard FICO-style bands in Ghana too). Please keep the `range` labels verbatim so the FE doesn't have to map them.
- `previous` — the **same-length window immediately before** the current one. 7d current = previous 7 days 14-7 days ago.
- `trend` — pre-computed deltas. `total_delta_pct` is a percentage change (positive means growth). `approval_delta_pp` is **percentage points** (not a ratio). `score_delta` is an integer delta in average credit score.
- `needs_attention` — counts for the action queue card. Can be approximate if it's expensive; precision matters less than low latency.

**Why deltas on the server**: computing a meaningful "vs previous" on the FE requires fetching both windows — doubling the data transfer. And we can never know we have enough history to be accurate. Server-side it's a single query with a `UNION` or two aggregates.

**Caching**: OK to cache server-side for 30–60 s per `(org, period)` key. FE polls at 60 s for `today`, 5 min for `7d`, 5 min for `30d`.

**Empty-state behaviour**:

- If the org has zero requests in the window → return all zeros. Do NOT 404.
- If `previous` is empty → set `trend.*` to `null` (not 0). The FE hides trend pills when they're null rather than showing a misleading "↑ 0%".

### 3.3 ⚠️ Filter extension — `GET /v1/score-requests?status=&decision=&per_page=`

The action-queue card on the dashboard (and a future "Needs review" tab on the Score Requests list) wants a pre-filtered fetch instead of the current client-side filter. Please extend the existing list endpoint with:

- **`status`** — already supported by the FE code (`PaginationParams.status`); please confirm the backend honours it for values `pending` · `processing` · `completed` · `failed`.
- **`decision`** 🆕 — new query param. Allowed values: `APPROVE` · `CONDITIONAL_APPROVE` · `DECLINE` · `REFER`. Comma-separated OR repeated `?decision=REFER&decision=DECLINE` both fine; pick one and document it.
- Ensure `per_page` supports up to `100` (already documented but worth confirming).

With those two filters the FE can drop the 200-record client-side filter entirely:

```http
# Referred items needing review — top 6, newest first
GET /v1/score-requests?decision=REFER&per_page=6&page=1

# Failures that blocked scoring
GET /v1/score-requests?status=failed&per_page=6
```

### 3.4 Polling — org side

| Data | Interval | Notes |
|---|---|---|
| `/v1/score-requests/stats` | 60 s for `today`, 5 min for `7d`/`30d` | |
| `/v1/score/batch` list | 10 s while any active job exists, else paused | FE stops polling when no job has status `queued`/`processing` |
| Action queue (`/v1/score-requests?decision=REFER`) | On tab focus + after any mutation | Not time-polled |

### 3.5 Rollout path

You can ship §3.2 and §3.3 independently. While waiting for `/stats`, the FE keeps its current client-side aggregation and will cut over once the endpoint is available — no coordinated deploy required. FE also has a feature flag (`NEXT_PUBLIC_USE_SCORE_STATS_ENDPOINT`) ready to gate the cutover.

---

## 4. Cross-cutting requirements (apply to both dashboards)

### 4.1 Authentication & permissions

| Endpoint | Required permission | Rejection behaviour |
|---|---|---|
| `/v1/monitoring/*` | Platform-admin JWT (implicit via path) + each tab gates further: `monitoring.infrastructure` / `monitoring.risk` / `monitoring.model_ops` / `monitoring.compliance` / `monitoring.alerts` | 403 with `error.code = "AUTHORIZATION_ERROR"` |
| `/v1/score-requests*` | `score_requests.list` / `score_requests.read` | 403 same shape |
| `/v1/score/batch*` | `batch_scoring.list` / `batch_scoring.read` | 403 same shape |

If a user lacks a single monitoring permission, the admin dashboard currently falls back to zeros for that KPI. A 403 response is fine — the FE silently degrades. Please don't 500 on missing permissions.

### 4.2 Error envelope

All endpoints above should use the existing envelope:

```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": {} } }
```

For FastAPI 422 validation errors, the existing `{ "detail": [{ "loc", "msg", "type" }] }` shape is handled by the FE's axios interceptor; no change needed.

### 4.3 Date & number formatting

- All timestamps: **ISO-8601 with timezone** (`2026-04-24T11:22:33Z`). No bare date-times, no epoch ms.
- Percentages: **0–100 scale** with `_pct` suffix on the field name. Never send `0.527` when you mean 52.7 %.
- Percentage-point deltas: use `_delta_pp` suffix (e.g. `approval_delta_pp`). Percentage-change deltas use `_delta_pct`. The FE already handles the convention.
- Money: bare number with `_ghs` suffix (e.g. `loan_amount_ghs`). No currency strings.

### 4.4 Pagination

Paginated lists (score requests, batch jobs, admin list, platform logs) all share:

```json
{ "items": [...], "total": 184, "page": 1, "per_page": 20, "total_pages": 10 }
```

Please keep this shape everywhere. The FE has a shared `PaginatedResponse<T>` type that assumes it.

---

## 5. Summary — punch list for backend

| # | Change | Scope | Priority |
|---|---|---|---|
| 1 | **Create `GET /v1/score-requests/stats?period=`** as specified in §3.2 | New endpoint | 🔴 **High** — unblocks correct org KPIs |
| 2 | Add `decision=` filter to `GET /v1/score-requests` (§3.3) | Extension | 🟡 Medium — enables action-queue fetch |
| 3 | Confirm / add `status=` filter on same endpoint | Extension | 🟡 Medium |
| 4 | (Nice-to-have) Add `promoted_at` to `champions[]` in `/v1/monitoring/model-ops` | Field addition | 🟢 Low — polish |

Everything else the overview dashboards need already exists. 🎉

---

## 6. Contact

Frontend-side questions: open a ticket referencing this doc. The FE-side integration lives under:

- `src/app/(admin)/admin-dashboard/page.tsx`
- `src/app/(org)/dashboard/page.tsx`
- `src/lib/monitoring-service.ts`
- `src/lib/score-service.ts`
