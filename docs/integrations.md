# Backend integrations

The frontend has been built incrementally against a series of backend integration guides written by the API team. Each guide documents a vertical slice (RBAC, monitoring, batch scoring, dashboards) and was used as the spec for the corresponding FE work.

This doc indexes those guides and explains where each one is consumed in the codebase, so that:

- A new contributor can find the spec for any feature in one place.
- Backend changes that update a guide can be cross-referenced to the FE files that need updating.
- Outstanding follow-ups against any guide are visible.

The guides themselves live under [`docs/integration-guides/`](./integration-guides/).

---

## 1. Index

| Guide | Scope | Status on FE | Where consumed |
|---|---|---|---|
| [Dashboard integration](./integration-guides/fe_dashboard_integration_guide.md) | `GET /v1/score-requests/stats`, `decision=` filter, `promoted_at` field | ✅ Fully integrated | Org dashboard, score-requests list, admin dashboard |
| [Monitoring integration](./integration-guides/fe_monitoring_integration_guide.md) | `/v1/monitoring/{infrastructure,risk,model-ops,compliance,alerts}` | ✅ Fully integrated | Admin dashboard, admin monitoring page |
| [RBAC (org)](./integration-guides/fe_rbac_integration_guide.md) | Org-side roles + permissions, `/v1/permissions`, `/v1/roles/*`, `/auth/me` permissions | ✅ Fully integrated | `usePermissions`, role pickers, every gated UI element |
| [RBAC (admin)](./integration-guides/fe_admin_rbac_integration_guide.md) | Platform-admin roles, admin invite/CRUD, `/admin/admins/*` | ✅ Fully integrated | `/admin-access-control`, admin invite/edit modals |
| [Batch scoring](./integration-guides/fe_batch_scoring_integration_guide.md) | `/v1/score/batch/*` — submit, status, results, cancel | ✅ Fully integrated | Bulk-upload pages, dashboard active-jobs widget |

---

## 2. Mapping each guide to the codebase

### 2.1 Dashboard integration

**What it covers**

- `GET /v1/score-requests/stats?period=…` — server-aggregated org KPIs (replaces the FE's old "fetch 200 rows and aggregate client-side" path).
- `GET /v1/score-requests?decision=…` — multi-value decision filter on the list endpoint.
- `promoted_at` field on `champions[]` in `/v1/monitoring/model-ops`.

**Where the FE consumes it**

| Concern | File |
|---|---|
| Stats types + service method | [`src/lib/score-service.ts`](../src/lib/score-service.ts) — search for `ScoreRequestStatsResponse` and `getScoreRequestsStats` |
| `decision` filter passed to list API | [`src/lib/score-service.ts`](../src/lib/score-service.ts) — `getScoreRequests` |
| `decision` field on shared params | [`src/types/api-type.ts`](../src/types/api-type.ts) — `PaginationParams` |
| Org dashboard tiles + referral queue | [`src/app/(org)/dashboard/page.tsx`](../src/app/(org)/dashboard/page.tsx) |
| `decision=` filter UI on list page | [`src/app/(org)/score-requests/page.tsx`](../src/app/(org)/score-requests/page.tsx) |
| `promoted_at` on champion cards | [`src/types/monitoring-types.ts`](../src/types/monitoring-types.ts) (type) + [`src/app/(admin)/admin-dashboard/page.tsx`](../src/app/(admin)/admin-dashboard/page.tsx) (render) |

**Polling cadences** (per the guide):

- `/score-requests/stats?period=today` — 60 s.
- `/score-requests/stats?period=7d|30d|90d` — 5 min.
- Referral queue (`?decision=REFER`) — refetch on tab focus + after mutations; not time-polled.

**Open follow-ups**

- The guide's `today` window is documented as UTC-only (`00:00 UTC`). For Ghana orgs (UTC+0) this is functionally identical, but if the platform expands to other timezones the BE will need a `tz` query param.
- `decision_counts.FRAUD_HOLD` is included in responses even though our PRD originally listed only five buckets — the dashboard's outcome-mix card folds it in as a coloured row when present.

---

### 2.2 Monitoring integration

**What it covers**

The four monitoring tabs plus the alerts feed:

- `GET /v1/monitoring/infrastructure?period=…`
- `GET /v1/monitoring/risk?period=…`
- `GET /v1/monitoring/model-ops?period=…`
- `GET /v1/monitoring/compliance?period=…`
- `GET /v1/monitoring/alerts?status=&limit=`

**Where the FE consumes it**

| Concern | File |
|---|---|
| Service + query keys | [`src/lib/monitoring-service.ts`](../src/lib/monitoring-service.ts) |
| All response types | [`src/types/monitoring-types.ts`](../src/types/monitoring-types.ts) |
| Admin dashboard composition (4 tiles + traffic chart + alerts banner) | [`src/app/(admin)/admin-dashboard/page.tsx`](../src/app/(admin)/admin-dashboard/page.tsx) |
| Full monitoring page (all four tabs + alerts feed) | [`src/app/(admin)/admin-monitoring/page.tsx`](../src/app/(admin)/admin-monitoring/page.tsx) |

**RBAC**

Each tab is gated by a separate permission code (`MONITORING.{INFRASTRUCTURE,RISK,MODEL_OPS,COMPLIANCE,ALERTS}`). A user missing one permission sees the rest of the page render normally with the gated tab degrading to zeros / an empty chart — never an error.

---

### 2.3 RBAC (organization side)

**What it covers**

- The `permissions[]` array returned by `GET /auth/me` — flat list of dotted permission codes.
- Role catalog endpoints used by the org-side teams page.
- 403 handling and the "soft degrade" convention.

**Where the FE consumes it**

| Concern | File |
|---|---|
| `can()` API + permission set | [`src/hooks/use-permissions.ts`](../src/hooks/use-permissions.ts) |
| Permission catalog (codes) | [`src/lib/constant.ts`](../src/lib/constant.ts) — `PERMISSION_CODES` |
| Role picker | [`src/components/shared/role-picker.tsx`](../src/components/shared/role-picker.tsx) |
| Teams page (CRUD + role assignment) | [`src/app/(org)/teams/page.tsx`](../src/app/(org)/teams/page.tsx) |
| RBAC service (roles + permissions) | [`src/lib/rbac-service.ts`](../src/lib/rbac-service.ts) |

See [auth-and-rbac.md](./auth-and-rbac.md) for the runtime story (how `can()` is wired and where it's used).

---

### 2.4 RBAC (admin side)

**What it covers**

- Platform-admin roles (`SUPER_ADMIN`, `RISK_ANALYST`, `MODEL_OPS_ENGINEER`, `COMPLIANCE_OFFICER`, `INFRASTRUCTURE_ENGINEER`).
- `/admin/admins/*` endpoints for managing admin users.
- Custom role CRUD on the platform side.

**Where the FE consumes it**

| Concern | File |
|---|---|
| Admin service | [`src/lib/admin-management-service.ts`](../src/lib/admin-management-service.ts) |
| RBAC service (also used here) | [`src/lib/rbac-service.ts`](../src/lib/rbac-service.ts) |
| Access-control page (admins · roles · permissions tabs) | [`src/app/(admin)/admin-access-control/page.tsx`](../src/app/(admin)/admin-access-control/page.tsx) |
| Invite / edit / suspend modals | [`src/components/admin/admins/`](../src/components/admin/admins/), [`src/components/admin/rbac/`](../src/components/admin/rbac/) |

The seeded system roles are not editable; this is enforced visually (read-only rendering) and confirmed by the backend on save.

---

### 2.5 Batch scoring

**What it covers**

- `POST /v1/score/batch` — submit a batch (CSV/Excel parsed client-side, then sent as JSON).
- `GET /v1/score/batch?status=&page=&page_size=` — list jobs.
- `GET /v1/score/batch/{job_id}` — job status & item counts.
- `GET /v1/score/batch/{job_id}/results` — per-row results.
- `POST /v1/score/batch/{job_id}/cancel` — cancel queued/processing jobs.

**Where the FE consumes it**

| Concern | File |
|---|---|
| Service + types + query keys | [`src/lib/score-service.ts`](../src/lib/score-service.ts) — search for `submitBatch`, `BATCH_KEYS`, `BatchJobListItem` |
| Schema (CSV → submit payload) | [`src/lib/schemas/batch-scoring.ts`](../src/lib/schemas/batch-scoring.ts) |
| Bulk-upload landing page | [`src/app/(org)/score-requests/bulk/page.tsx`](../src/app/(org)/score-requests/bulk/page.tsx) |
| Per-job detail | [`src/app/(org)/score-requests/bulk/[jobId]/page.tsx`](../src/app/(org)/score-requests/bulk/[jobId]/page.tsx) |
| In-flight jobs widget on dashboard | [`src/app/(org)/dashboard/page.tsx`](../src/app/(org)/dashboard/page.tsx) — `activeBatches` |

**Polling cadence**: 10 s while at least one job is `queued` / `processing`, paused otherwise. Implemented by `refetchInterval` on the batch list query plus a `enabled` predicate on the active set.

---

## 3. When a guide changes

Backend updates that change a contract should:

1. Update the corresponding markdown under [`docs/integration-guides/`](./integration-guides/).
2. Update the matching FE files listed in §2 above.
3. Run `npx tsc --noEmit` and `npm run build` — type drift between the BE shape and the FE service is the most common cause of dashboard breakage.
4. Update [feature-map.md](./feature-map.md) if a page's endpoint list changes.

For breaking changes, prefer a feature flag (`NEXT_PUBLIC_*`) gate so the FE can roll back independently. The dashboard guide (§7) used this approach during the cutover from client-side aggregation to the new stats endpoint.

---

## 4. Backend product context

Two non-integration documents in the repo root capture the broader product spec — useful for understanding *why* an endpoint looks the way it does:

- [`prd_credit_scoring_platform.md`](../prd_credit_scoring_platform.md) — top-level product requirements.
- [`dashboard_backend_requirements.md`](../dashboard_backend_requirements.md) — the original FE → BE requirements doc that produced [fe_dashboard_integration_guide.md](./integration-guides/fe_dashboard_integration_guide.md).
