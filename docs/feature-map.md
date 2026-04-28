# Feature map

A flat index of every page in the app — what it does, which backend endpoints it consumes, and which permission codes gate the actions it offers. Use this to find the entry-point file for a feature without grepping the whole tree.

Notation:

- **Endpoints** are listed using the constants from [`src/lib/constant.ts`](../src/lib/constant.ts). Where a page consumes many endpoints, only the primary ones are listed; supporting calls (lookups, dropdown options) are omitted.
- **Permissions** show the `PERMISSION_CODES` keys (not the literal dotted strings). A blank cell means the page is reachable by anyone in the right portal scope.
- **Status legend**: 🟢 stable · 🟡 partial / placeholder content · ⚪ scaffolded but not yet wired · ⚫ disabled (folder hidden, route not registered).

---

## Auth (`/`, `(auth)`)

Reachable to anyone (the proxy bounces logged-in users away to their dashboard).

| Route | Page file | Purpose | Endpoints | Status |
|---|---|---|---|---|
| `/` | [`app/page.tsx`](../src/app/page.tsx) | Public landing — bounces authed users to their portal. | — | 🟢 |
| `/login` | [`app/(auth)/login/page.tsx`](../src/app/(auth)/login/page.tsx) | Org user sign-in (+ optional 2FA challenge). | `AUTH.LOGIN`, `AUTH.VERIFY_2FA` | 🟢 |
| `/admin-login` | [`app/(auth)/admin-login/page.tsx`](../src/app/(auth)/admin-login/page.tsx) | Admin sign-in (+ optional 2FA challenge). | `AUTH.LOGIN`, `AUTH.VERIFY_2FA` | 🟢 |
| `/forgot-password` | [`app/(auth)/forgot-password/page.tsx`](../src/app/(auth)/forgot-password/page.tsx) | Request a password-reset email. | `AUTH.FORGOT_PASSWORD` | 🟢 |
| `/reset-password` | [`app/(auth)/reset-password/page.tsx`](../src/app/(auth)/reset-password/page.tsx) | Redeem a reset token + set a new password. | `AUTH.RESET_PASSWORD` | 🟢 |

---

## Organization portal (`(org)`)

Available to org users. Per-action gating via `PERMISSION_CODES`.

| Route | Page file | Purpose | Primary endpoints | Permission gates | Status |
|---|---|---|---|---|---|
| `/dashboard` | [`(org)/dashboard/page.tsx`](../src/app/(org)/dashboard/page.tsx) | KPIs, outcome mix, score-spread histogram, referral queue, in-flight batch jobs. | `SCORE_REQUESTS.STATS`, `SCORE_REQUESTS.BASE` (filtered by `decision=REFER`), `BATCH_SCORING.BASE`, `AUTH.ME` | `BATCH_SCORING.LIST`, `SCORE_REQUESTS.CREATE` | 🟢 |
| `/score-requests` | [`(org)/score-requests/page.tsx`](../src/app/(org)/score-requests/page.tsx) | Searchable, filterable list of score requests. | `SCORE_REQUESTS.BASE` | `SCORE_REQUESTS.LIST`, `SCORE_REQUESTS.CREATE` | 🟢 |
| `/score-requests/new` | [`(org)/score-requests/new/page.tsx`](../src/app/(org)/score-requests/new/page.tsx) | Single-applicant scoring wizard: bureau lookup → confirm → submit. | `BUREAU.LOOKUP`, `SCORE_REQUESTS.BASE` | `SCORE_REQUESTS.CREATE` | 🟢 |
| `/score-requests/[id]` | [`(org)/score-requests/[id]/page.tsx`](../src/app/(org)/score-requests/[id]/page.tsx) | Score request detail: bureau, score, decision, override, outcome, performance reporting. | `SCORE_REQUESTS.BY_ID`, `SCORE_REQUESTS.SCORING_RESULT`, `SCORE_REQUESTS.OVERRIDE`, `SCORE_REQUESTS.OUTCOME`, `SCORE_REQUESTS.PERFORMANCE` | `SCORE_REQUESTS.READ`, `SCORE_REQUESTS.OVERRIDE`, `SCORE_REQUESTS.REPORT_OUTCOME`, `SCORE_REQUESTS.REPORT_PERFORMANCE` | 🟢 |
| `/score-requests/bulk` | [`(org)/score-requests/bulk/page.tsx`](../src/app/(org)/score-requests/bulk/page.tsx) | CSV/Excel batch upload + active-job list. | `BATCH_SCORING.BASE` | `BATCH_SCORING.CREATE`, `BATCH_SCORING.LIST` | 🟢 |
| `/score-requests/bulk/[jobId]` | [`(org)/score-requests/bulk/[jobId]/page.tsx`](../src/app/(org)/score-requests/bulk/[jobId]/page.tsx) | Per-job progress + per-row results + cancel. | `BATCH_SCORING.BY_ID`, `BATCH_SCORING.RESULTS`, `BATCH_SCORING.CANCEL` | `BATCH_SCORING.READ`, `BATCH_SCORING.CANCEL` | 🟢 |
| `/developers` | [`(org)/_developers/page.tsx`](../src/app/(org)/_developers/page.tsx) | API keys, webhooks, API logs. **Folder is `_developers/` — Next ignores underscore-prefixed folders, so the route is currently not registered.** | `ORG.API_KEYS`, `ORG.WEBHOOKS`, `ORG.LOGS`, `ORG.WEBHOOK_EVENTS` | `API_KEYS.{LIST,CREATE,REVOKE}`, `WEBHOOKS.{LIST,MANAGE}`, `API_LOGS.READ` | ⚫ |
| `/teams` | [`(org)/teams/page.tsx`](../src/app/(org)/teams/page.tsx) | Org user CRUD: invite, edit role, suspend, delete. | `ORG.USERS`, `ORG.SUSPEND_USER`, `ORG.ACTIVATE_USER`, `RBAC.ROLES` | `USERS.{LIST,INVITE,UPDATE,SUSPEND,DELETE}`, `ROLES.{READ,ASSIGN}` | 🟢 |
| `/settings` | [`(org)/settings/page.tsx`](../src/app/(org)/settings/page.tsx) | Personal-account tab + Org-profile tab (rename, contact details). | `AUTH.ME`, `AUTH.CHANGE_PASSWORD`, `AUTH.SETUP_2FA`, `AUTH.VERIFY_2FA`, `AUTH.REMOVE_2FA`, `ORG.PROFILE` | — | 🟢 |

---

## Admin portal (`(admin)`)

Available only to platform administrators. Many pages further gate per-action by RBAC code.

| Route | Page file | Purpose | Primary endpoints | Permission gates | Status |
|---|---|---|---|---|---|
| `/admin-dashboard` | [`(admin)/admin-dashboard/page.tsx`](../src/app/(admin)/admin-dashboard/page.tsx) | Platform-wide KPIs (requests, approval, P99, model AUC), traffic chart, decision mix, alerts banner, champion-models strip. | `MONITORING.{INFRASTRUCTURE,RISK,MODEL_OPS,ALERTS}` | `MONITORING.{INFRASTRUCTURE,RISK,MODEL_OPS,ALERTS}` (degrades to zeros on 403 per page) | 🟢 |
| `/admin-monitoring` | [`(admin)/admin-monitoring/page.tsx`](../src/app/(admin)/admin-monitoring/page.tsx) | Tabs: infrastructure · risk · model-ops · compliance · alerts. | `MONITORING.{INFRASTRUCTURE,RISK,MODEL_OPS,COMPLIANCE,ALERTS}` | `MONITORING.{INFRASTRUCTURE,RISK,MODEL_OPS,COMPLIANCE,ALERTS}` | 🟢 |
| `/organizations` | [`(admin)/organizations/page.tsx`](../src/app/(admin)/organizations/page.tsx) | List, search, provision, suspend orgs. | `ADMIN.ORGANIZATIONS`, `ADMIN.PROVISION`, `ADMIN.SUSPEND`, `ADMIN.ACTIVATE` | `ADMIN.{ORGS_READ,ORGS_CREATE,ORGS_PROVISION,ORGS_SUSPEND}` | 🟢 |
| `/organizations/[id]` | [`(admin)/organizations/[id]/page.tsx`](../src/app/(admin)/organizations/[id]/page.tsx) | Org detail + member list + suspend/activate. | `ADMIN.ORGANIZATIONS`, `ADMIN.ORG_USERS`, `ADMIN.ORG_USER_BY_ID` | `ADMIN.ORGS_READ`, `ADMIN.ORGS_UPDATE`, `USERS.{LIST,UPDATE,SUSPEND,DELETE}` | 🟢 |
| `/admin-score-requests` | [`(admin)/admin-score-requests/page.tsx`](../src/app/(admin)/admin-score-requests/page.tsx) | Cross-org score-request audit list. | `SCORE_REQUESTS.BASE` | `SCORE_REQUESTS.LIST` | 🟢 |
| `/scoring-engine` | [`(admin)/scoring-engine/page.tsx`](../src/app/(admin)/scoring-engine/page.tsx) | Current model overview + rule evaluation entry points. | `MODELS.CURRENT`, `RULES.EVALUATE` | `MODELS.READ`, `RULES.EVALUATE` | 🟡 |
| `/training` | [`(admin)/training/page.tsx`](../src/app/(admin)/training/page.tsx) | Training data list, upload, status. | `ADMIN.TRAINING_DATA`, `ADMIN.UPLOAD_TRAINING`, `ADMIN.SOURCES` | `ADMIN.{TRAINING_READ,TRAINING_UPLOAD,TRAINING_APPROVE,SOURCES_READ,SOURCES_MANAGE}` | 🟢 |
| `/training/[id]` | [`(admin)/training/[id]/page.tsx`](../src/app/(admin)/training/[id]/page.tsx) | Per-training-data record detail + status. | `ADMIN.TRAINING_BY_ID`, `ADMIN.TRAINING_STATUS` | `ADMIN.{TRAINING_READ,TRAINING_APPROVE}` | 🟢 |
| `/training/sources/[id]` | [`(admin)/training/sources/[id]/page.tsx`](../src/app/(admin)/training/sources/[id]/page.tsx) | Per-source uploads list. | `ADMIN.SOURCE_BY_ID`, `ADMIN.SOURCE_UPLOADS` | `ADMIN.{SOURCES_READ,SOURCES_MANAGE}` | 🟢 |
| `/admin-access-control` | [`(admin)/admin-access-control/page.tsx`](../src/app/(admin)/admin-access-control/page.tsx) | Tabs: admins (invite, suspend), roles (CRUD), permission catalog. | `ADMIN.ADMINS`, `ADMIN.ADMIN_BY_ID`, `ADMIN.SUSPEND_ADMIN`, `ADMIN.ACTIVATE_ADMIN`, `RBAC.PERMISSIONS`, `RBAC.ROLES`, `RBAC.ROLE_BY_ID` | `ADMIN.{ADMINS_*}`, `ADMIN.{ROLES_*}` | 🟢 |
| `/admin-settings` | [`(admin)/admin-settings/page.tsx`](../src/app/(admin)/admin-settings/page.tsx) | Personal security (password, 2FA) + global platform configuration. | `AUTH.ME`, `AUTH.CHANGE_PASSWORD`, `AUTH.SETUP_2FA`, `AUTH.VERIFY_2FA`, `AUTH.REMOVE_2FA` | — | 🟢 |

---

## Cross-cutting

Some endpoints are consumed app-wide rather than from a specific page:

| Endpoint | Where called | Purpose |
|---|---|---|
| `AUTH.ME` | `AuthContext.initializeAuth` ([`auth-context.tsx`](../src/contexts/auth-context.tsx)) | Resolve `permissions[]` on every load and after refresh. |
| `AUTH.REFRESH` | Proxy Route Handler ([`app/api/proxy/[...path]/route.ts`](../src/app/api/proxy/[...path]/route.ts)) | Server-side transparent token refresh on 401. |
| `AUTH.LOGOUT` | `authService.logout` (called by `AuthContext.logout` if used; the inactivity timer also clears the session) | Server-side session invalidation. |

---

## Missing, disabled, or planned

The following pages from the original PRD are not currently routable or are scaffolded with placeholder content:

- **`/developers`** — page code lives under `(org)/_developers/`. The leading underscore makes it a private folder in Next 16, so the route is not exposed. To re-enable, rename the folder back to `developers/` and uncomment `ROUTES.ORG.DEVELOPERS` in [`src/lib/constant.ts`](../src/lib/constant.ts).
- **`/reports`** — not implemented; the folder under `(org)/` does not exist. Was on the original PRD; needs both a reports service and UI.
- **`/scoring-engine`** — partial; the model-routing UI hasn't landed.
- A dedicated **audit-log** view for org admins (only surfaced via `/developers` API logs, which is currently disabled).

See [known-issues.md](./known-issues.md) for the broader follow-up backlog.
