# Jira Task Guide — PaySwitch Credit Scoring Frontend

**PRD Version**: 1.0 (February 2025)  
**Role**: Frontend Developer  
**Timeline**: 3 months (12 weeks)  
**Last Updated**: 2026-02-28

> Tasks marked ✅ are **DONE** — add to Jira as completed.  
> All others are **TO DO**.

---

## Epics

| Epic   | Name                                         |
| ------ | -------------------------------------------- |
| FE-EP1 | Authentication & Onboarding                  |
| FE-EP2 | Admin Portal                                 |
| FE-EP3 | Organization Portal                          |
| FE-EP4 | Cross-Cutting (Testing, Performance, DevOps) |

---

## ✅ Task 1: Project Foundation & UI Library

**Issue Type**: Task  
**Epic**: FE-EP1  
**Status**: ✅ DONE  
**Summary**: Set up Next.js project, build 29 UI primitives, API client, type system, and providers  
**Story Points**: 21  
**Priority**: Critical  
**Description**:

```
Project scaffolding and all foundational layers:

1. Next.js App Router setup with TypeScript
2. Global CSS, design tokens, root layout, error boundary, 404 page
3. 29 UI components (AlertDialog, Alert, Avatar, Badge, Button, Calendar,
   Card, Checkbox, Command, Dialog, DropdownMenu, Form, InputOTP, Input,
   Label, Popover, Progress, RadioGroup, ScrollArea, Select, Separator,
   Sheet, Skeleton, Sonner, Switch, Table, Tabs, Textarea, Tooltip)
4. API client with Axios interceptors (api-client.ts)
5. React Query client (query-client.tsx)
6. Session storage management (session-storage.ts)
7. Route constants (constant.ts), CORS proxy (proxy.ts), utils (utils.ts)
8. Component providers wrapper (providers.tsx)
9. Type system: models.ts, organization-type.ts, training-type.ts,
   auth-type.ts, api-type.ts — covering Organization, User, ApiKey,
   ScoreRequest, ApplicantInfo, EmploymentInfo, LoanRequestInfo, etc.
```

**Acceptance Criteria**:

- [x] Next.js running locally with TypeScript
- [x] All 29 UI primitives created and reusable
- [x] API client handles auth headers and interceptors
- [x] React Query configured with cache strategy
- [x] Session persistence working across reloads
- [x] All route constants defined
- [x] All PRD entities have TypeScript types

---

## ✅ Task 2: Authentication Pages & Service

**Issue Type**: Task  
**Epic**: FE-EP1  
**Status**: ✅ DONE  
**Summary**: Build login, forgot password, reset password pages with auth service and session management  
**Story Points**: 10  
**Priority**: Critical  
**Description**:

```
Authentication flow:

1. Login page — email + password form with validation
2. Forgot password page — email submission for reset
3. Reset password page — new password entry with token
4. Auth layout wrapper
5. Auth service (auth-service.ts):
   - Login / logout API calls
   - Access + refresh token management
   - Password reset flow
6. Session persistence via session-storage
7. Auth context provider + hooks
```

**Acceptance Criteria**:

- [x] Login form with validation and error handling
- [x] Forgot password sends reset email
- [x] Reset password updates credentials
- [x] Tokens stored and included in API requests
- [x] Session persists across page reloads

---

## ✅ Task 3: Admin Portal — Organization Management

**Issue Type**: Task  
**Epic**: FE-EP2  
**Status**: ✅ DONE  
**Summary**: Build admin layout, organization list/detail pages, CRUD modals, and organization service  
**Story Points**: 26  
**Priority**: Critical  
**Description**:

```
Admin portal shell + full organization management:

1. Admin sidebar layout — collapsible nav with: Dashboard, Organizations,
   Training, AI Monitor, Compliance, Reports, Settings
2. Mobile-responsive Sheet navigation + user dropdown
3. Organization list page — paginated table, search, status filters
4. Add Organization modal (name, short name, industry, contact info)
5. Organization detail page with status badge
6. Edit Organization modal
7. Provision Organization modal (triggers API key gen + welcome email)
8. Suspend Organization modal (with reason)
9. Activate Organization confirm modal
10. Organization service (organization-service.ts):
    - list, getById, create, update, provision, suspend, activate, listUsers
    - Snake→camel mappers, React Query keys
11. Organization types (organization-type.ts)
```

**Acceptance Criteria**:

- [x] Admin sidebar renders all nav items with icons, collapses, mobile-ready
- [x] Org table with search, status filter, pagination
- [x] Add org modal creates via API
- [x] Org detail shows info + status
- [x] Edit, provision, suspend, activate all functional
- [x] Service layer with full CRUD and snake→camel mapping

---

## ✅ Task 4: Admin Portal — Training Data Management

**Issue Type**: Task  
**Epic**: FE-EP2  
**Status**: ✅ DONE  
**Summary**: Build training data list, detail, data sources pages with training service  
**Story Points**: 13  
**Priority**: Critical  
**Description**:

```
Training data management:

1. Training uploads list page (paginated, filterable by source/status)
2. Upload detail page (metadata, quality info)
3. Data sources page (list, create source)
4. Approve / reject / retry upload actions
5. Training service (training-service.ts):
   - listUploads, getUpload, uploadTrainingData, getUploadStatus
   - approveUpload, rejectUpload, retryUpload
   - listSources, createSource, getSource, listSourceUploads
6. Training types (training-type.ts)
7. Training components (4 components)
```

**Acceptance Criteria**:

- [x] Uploads list with status filters and pagination
- [x] Upload detail shows metadata
- [x] Data sources CRUD working
- [x] Approve/reject/retry actions functional
- [x] File upload with multipart form data
- [x] Service with snake→camel mapping

---

## ✅ Task 5: Org Portal — Score Requests Core

**Issue Type**: Task  
**Epic**: FE-EP3  
**Status**: ✅ DONE  
**Summary**: Build org layout, score request list/new/detail/bulk pages, and score service  
**Story Points**: 26  
**Priority**: Critical  
**Description**:

```
Organization portal shell + core score request workflow:

1. Org sidebar layout — collapsible nav with: Dashboard, Score Requests,
   Developers, Team, Reports, Settings
2. Mobile-responsive Sheet navigation + user/org dropdown
3. Score request list page (paginated, searchable)
4. New score request page — multi-section form (Personal, Employment,
   Loan, Financial, Consent)
5. Score request detail page (basic results display)
6. Bulk scoring page (initial structure)
7. Score service (score-service.ts):
   - getScoreRequests, getScoreRequestById, createScoreRequest,
     getScoreRequestOutcome
   - React Query keys
8. Placeholder pages: Dashboard, Developers, Team, Reports, Settings
```

**Acceptance Criteria**:

- [x] Org sidebar renders all nav items, collapses, mobile-ready
- [x] Score request table with search and pagination
- [x] New request form with validation and submit
- [x] Detail page renders applicant and score info
- [x] Score service endpoints connected
- [x] All placeholder pages render

---

## Task 6: Shared Components & Extended Services

**Issue Type**: Task  
**Epic**: FE-EP1  
**Summary**: Build reusable DataTable, charts, StatusBadge, FileUpload, and remaining API service layers  
**Story Points**: 13  
**Priority**: High  
**Description**:

```
Reusable components needed across both portals:

1. DataTable: sortable, filterable, paginated table wrapper
2. StatusBadge: unified badge for risk categories, request status, org status
3. FileUpload: drag-and-drop with progress indicator
4. EmptyState: generic empty state for tables/lists
5. Chart primitives: Recharts or Nivo wrapper for bar, line, pie, histogram

Remaining API services (follow existing pattern: raw types → mapper → query keys → methods):
6. Model management service (model-service.ts)
7. Compliance / audit service (compliance-service.ts)
8. Usage / metering service (usage-service.ts)
9. API key management service (api-key-service.ts)
10. Team management service (team-service.ts)
11. Types for each new service in types/ directory
```

**Acceptance Criteria**:

- [ ] DataTable supports sorting, filtering, pagination via props
- [ ] StatusBadge renders correct color for all status types across app
- [ ] FileUpload with drag-and-drop and progress bar
- [ ] EmptyState customizable via props
- [ ] Chart wrapper renders bar, line, pie, and histogram charts
- [ ] All new services follow snake→camel mapping pattern
- [ ] React Query keys defined for each service
- [ ] Types created for models, compliance, usage, API keys, team

**Dependencies**: Backend API contracts for each new module

---

## Task 7: Authentication — 2FA, Activation & Route Guards

**Issue Type**: Task  
**Epic**: FE-EP1  
**Summary**: Add two-factor authentication, account activation for invited users, and route protection  
**Story Points**: 13  
**Priority**: High  
**Description**:

```
Complete the authentication system:

1. 2FA verification page (OTP input after login) — PRD §3.2.2
   - TOTP (authenticator app) and SMS options
   - Enable/disable 2FA in user settings
   - Auth service: verify2FA(), enable2FA(), disable2FA()

2. Account activation page — PRD Journey A1 Step 3
   - Token validation from email link
   - Set initial password form with strength indicator
   - Redirects to dashboard on success

3. Invite acceptance page
   - For team members invited by Org Admin
   - Creates account and joins organization

4. Protected route guards
   - Admin routes: only admin users (super_admin, data_science, operations)
   - Org routes: only org users (admin, credit_officer, developer, viewer)
   - Auth routes: redirect to dashboard if already logged in
   - 401 interceptor: silent token refresh

Files:
- app/(auth)/verify-2fa/page.tsx
- app/(auth)/activate/page.tsx
- app/(auth)/accept-invite/page.tsx
- middleware.ts
- lib/auth-service.ts (extend)
```

**Acceptance Criteria**:

- [ ] 2FA page renders after login when required
- [ ] OTP input with 6-digit validation
- [ ] Enable/disable 2FA flow end-to-end
- [ ] Activation page validates token, sets password, redirects
- [ ] Invite acceptance creates account and joins org
- [ ] Unauthenticated users redirected to login
- [ ] Admin users cannot access org routes and vice versa
- [ ] Expired tokens silently refreshed on 401

**Dependencies**: Backend 2FA and activation endpoints

---

## Task 8: Admin — Organization Detail Enhancement

**Issue Type**: Task  
**Epic**: FE-EP2  
**Summary**: Add usage metrics, API keys, users, and activity tabs to organization detail page  
**Story Points**: 8  
**Priority**: High  
**Description**:

```
Extend the organization detail page with tabbed sections — PRD §6.1.2:

1. Usage tab
   - Score requests over time chart
   - API call volume and trends
   - Usage breakdown by endpoint

2. API Keys tab
   - List keys (masked prefix, name, environment, status, last used)
   - Revoke key with confirmation dialog

3. Users tab
   - Paginated list of org users (name, email, role label, status)
   - Connected to existing listUsers() endpoint

4. Activity log tab
   - Recent organization actions (login, API calls, scoring, etc.)

Files: app/(admin)/organizations/[id]/page.tsx (extend with Tabs component)
```

**Acceptance Criteria**:

- [ ] Tabs UI: Overview, Usage, API Keys, Users, Activity
- [ ] Usage tab shows request volume chart
- [ ] API Keys tab lists masked keys with revoke action
- [ ] Users tab shows paginated user list
- [ ] Activity log renders recent actions
- [ ] Tab switching without page reload

**Dependencies**: Task 6 (usage service, chart components)

---

## Task 9: Admin — Data Quality & Model Management

**Issue Type**: Task  
**Epic**: FE-EP2  
**Summary**: Build data quality dashboard, model registry, champion-challenger comparison, and promotion workflow  
**Story Points**: 21  
**Priority**: High  
**Description**:

```
Data quality enhancements + new model management module — PRD §6.1.3:

Data Quality (extend existing training pages):
1. Quality scores per upload with visual indicators
2. Anomaly detection results display
3. PII detection and masking report
4. Field mapping report viewer
5. Feature distribution histograms
6. Real-time upload status polling with progress

Model Management (new pages):
7. Model registry page — all versions with status, metrics, dates
8. Model detail page — AUC, KS, Gini metrics, feature importance chart,
   confusion matrix, model card, training data lineage
9. Champion vs Challenger comparison (side-by-side metrics)
10. Fairness reports (demographic parity, equalized odds, disparate impact)
11. Model promotion workflow (request → approve/reject → rollout options)
12. Model rollback (revert with confirmation)
13. Rollout options: immediate / gradual (10→50→100%) / scheduled

Files:
- app/(admin)/training/[id]/page.tsx (extend)
- app/(admin)/models/page.tsx (new)
- app/(admin)/models/[id]/page.tsx (new)
- lib/model-service.ts (new)
- Update admin layout nav to include "Models"
```

**Acceptance Criteria**:

- [ ] Quality scores, anomalies, PII detection visible on upload detail
- [ ] Feature distribution histograms render
- [ ] Upload progress polls in real-time
- [ ] Model registry lists all versions with key metrics
- [ ] Model detail shows AUC, KS, Gini, feature importance, confusion matrix
- [ ] Champion-Challenger side-by-side comparison renders
- [ ] Fairness metrics with pass/fail indicators
- [ ] Promotion workflow: request → approval → rollout
- [ ] Rollback with confirmation dialog

**Dependencies**: Task 6 (model service, chart components), Backend model APIs

---

## Task 10: Admin — Dashboard & Analytics

**Issue Type**: Task  
**Epic**: FE-EP2  
**Summary**: Build admin dashboard with platform KPIs, system health, alerts, and cross-org reports  
**Story Points**: 13  
**Priority**: High  
**Description**:

```
Admin dashboard and reports — PRD §6.1.1 + §6.1.4:

Dashboard:
1. Platform KPI cards (total orgs, requests today/week/month, trends)
2. Model health widget (current version, AUC, drift indicators)
3. System status widget (service health, latency p50/p95/p99, error rates)
4. Active alerts widget (incidents, model drift warnings)
5. Charts: scoring volume over time, org growth, risk category distribution
6. Auto-refresh / polling

Reports:
7. Cross-organization analytics (usage by org, score distributions)
8. Platform-wide scoring trend charts
9. Report export (PDF, CSV download)

Files:
- app/(admin)/admin-dashboard/page.tsx (rebuild)
- app/(admin)/admin-reports/page.tsx (rebuild)
```

**Acceptance Criteria**:

- [ ] KPI cards show live data from API
- [ ] Model health shows current version + AUC
- [ ] System status indicators (green/yellow/red)
- [ ] Alerts widget lists active issues
- [ ] Dashboard charts render with real data
- [ ] Cross-org analytics table and charts
- [ ] PDF and CSV export functional

**Dependencies**: Task 6 (analytics service, chart components)

---

## Task 11: Admin — AI Monitor, Compliance & Settings

**Issue Type**: Task  
**Epic**: FE-EP2  
**Summary**: Build AI agent dashboard, audit log, compliance reports, and admin settings  
**Story Points**: 21  
**Priority**: Medium  
**Description**:

```
Operational admin pages — PRD §9.1 + §6.1.4 + §3.1.1:

AI Monitor:
1. Agent status cards for all 7 agents (Data Quality, Feature Engineering,
   Model Training, Decision, Risk Monitoring, Compliance, Customer Service)
2. Agent activity log (recent actions per agent)
3. Risk monitoring: PSI, AUC trends, drift detection alerts
4. Manual agent trigger controls

Compliance & Audit:
5. Audit log viewer (table: user, action, timestamp, details)
6. Search/filter by user, action, date range
7. Compliance report generator (PDF download for regulators)
8. Data retention policy configuration

Admin Settings:
9. Platform config (scoring thresholds, API rate limits)
10. Admin user management (invite/remove admin team members)
11. Notification preferences

Files:
- app/(admin)/ai-monitor/page.tsx (rebuild)
- app/(admin)/compliance/page.tsx (rebuild)
- app/(admin)/admin-settings/page.tsx (rebuild)
- lib/compliance-service.ts (new)
```

**Acceptance Criteria**:

- [ ] All 7 agents displayed with real-time status
- [ ] Agent activity log renders per agent
- [ ] Drift alerts visible
- [ ] Audit log table with search, filter, pagination
- [ ] Compliance report downloads as PDF
- [ ] Data retention settings editable
- [ ] Platform config (thresholds, rate limits) editable
- [ ] Admin users invitable and removable

**Dependencies**: Task 6 (compliance service), Backend agent/audit APIs

---

## Task 12: Org — Score Request Enhancement

**Issue Type**: Task  
**Epic**: FE-EP3  
**Summary**: Extend score form to full PRD schema, build rich score card, decision recording, and advanced filters  
**Story Points**: 21  
**Priority**: High  
**Description**:

```
Complete the core scoring workflow — PRD §7.1, §7.2, Journey O1:

Form Enhancement (cover full PRD §7.1 schema):
1. Personal Info: address (street, city, region, digital address),
   dependents, education level
2. Employment: employer industry, total experience, income verification,
   other income sources
3. Loan: all 9 purpose types, collateral type + value
4. Financial Profile: existing loans (multi-entry add/remove), bank accounts
   (multi), mobile money (providers, avg flows), credit card utilization,
   expenses, assets
5. Bureau Data: score, provider, accounts, inquiries (optional section)
6. Alternative Data: utility/rent/telco payment history, social signals
7. Consent: required checkbox, date, reference, data sharing auth
8. Metadata: channel, product type, branch code, officer ID
9. Conditional rendering (e.g., employer fields only when employed)
10. Client-side validation matching PRD required fields

Score Results Display (PRD §7.2 + Journey O1 Step 6):
11. Score gauge: value/850 with risk category badge, confidence bar, percentile
12. Data quality flag (sufficient / limited / thin file)
13. Risk factors: top 5 with 🔴🟡🟢 impact icons and severity
14. Score breakdown: 7 components with A-F grades and weights
15. Recommendations with priority labels
16. Affordability: DTI current/projected, disposable income, max amount
17. Model info: version, type, features used, data sources
18. Score validity countdown (valid_until)
19. Download PDF report, Add Internal Notes

Decision Recording (Journey O1 Step 7):
20. "Mark Decision" button → modal with:
    - Approved: amount, tenure, interest rate
    - Declined: required reason
    - Referred: required notes
21. POST /v1/score-requests/{id}/outcome
22. Decision history displayed on detail page

List Enhancement:
23. Advanced filters: status, risk_category, date range, reference_id
24. Export filtered results as CSV

Files:
- app/(org)/score-requests/new/page.tsx (extend)
- app/(org)/score-requests/[id]/page.tsx (redesign)
- app/(org)/score-requests/page.tsx (extend)
- lib/score-service.ts (extend: recordDecision, types)
```

**Acceptance Criteria**:

- [ ] All PRD §7.1 fields present in form
- [ ] Multi-entry fields (loans, accounts) support add/remove rows
- [ ] Conditional rendering works (e.g., employer fields hidden when unemployed)
- [ ] Client-side validation with error highlighting
- [ ] Score card renders: gauge, risk badge, confidence, percentile
- [ ] Risk factors with colored impact icons
- [ ] Score components chart with A-F grades
- [ ] Recommendations and affordability sections render
- [ ] PDF download functional
- [ ] Decision modal: approve/decline/refer with required fields
- [ ] Decision saved and displayed on detail page
- [ ] Advanced filters (status, risk, dates) on list page
- [ ] CSV export of filtered results

**Dependencies**: Task 6 (chart components)

---

## Task 13: Org — Bulk Credit Scoring

**Issue Type**: Task  
**Epic**: FE-EP3  
**Summary**: Build complete bulk scoring workflow: template download, upload, validation, progress, and results  
**Story Points**: 13  
**Priority**: Medium  
**Description**:

```
Bulk scoring for portfolio review — PRD §6.2.2 (P1) + Journey O3:

1. Bulk template download button (CSV/Excel)
2. File upload with drag-and-drop (FileUpload component)
3. File validation: format, required columns, data types
4. Validation summary: total records, valid, invalid (with reasons)
5. Estimated completion time display
6. Confirm submission button
7. Batch job progress: status bar, progress %, estimated remaining time
8. Real-time polling for job status updates
9. Results download:
   - Full results CSV (all scores + risk factors)
   - Summary report PDF (portfolio analysis, score distribution histogram)
   - Error report CSV (failed records + reasons)
10. Bulk scoring service endpoints

Files:
- app/(org)/score-requests/bulk/page.tsx (rebuild)
- lib/score-service.ts (extend: bulk endpoints)
```

**Acceptance Criteria**:

- [ ] Template downloadable in CSV/Excel format
- [ ] File upload validates format, columns, and data types
- [ ] Validation summary shows valid/invalid counts with reasons
- [ ] Estimated completion time displayed before submit
- [ ] Progress bar updates in real-time during processing
- [ ] Results downloadable in all 3 formats (CSV, PDF, error CSV)

**Dependencies**: Task 6 (FileUpload component), Backend bulk endpoints

---

## Task 14: Org — Dashboard & Reports

**Issue Type**: Task  
**Epic**: FE-EP3  
**Summary**: Build org dashboard with KPIs, charts, and org-level reports with export  
**Story Points**: 13  
**Priority**: High  
**Description**:

```
Org dashboard + reports — PRD §6.2.1 + §6.2.5:

Dashboard:
1. KPI cards: score requests today / this week / this month
2. Score distribution histogram (recent scores)
3. API health widget (success rate, latency — green/yellow/red)
4. Quick action buttons (New Request, View Recent, API Keys)
5. Daily scoring volume trend chart
6. Risk category breakdown donut chart

Reports:
7. Usage report: requests over time, breakdown by user
8. Score analytics: distribution, trends, comparison (P1)
9. Export request history as CSV
10. Scheduled reports — auto-email weekly/monthly (P2 — future)

Files:
- app/(org)/dashboard/page.tsx (rebuild)
- app/(org)/reports/page.tsx (rebuild)
```

**Acceptance Criteria**:

- [ ] KPI cards show live request counts
- [ ] Score distribution histogram renders
- [ ] API health indicators work (green/yellow/red)
- [ ] Quick actions navigate correctly
- [ ] Charts render with real data
- [ ] Usage report shows requests over time + by user
- [ ] CSV export of request history functional

**Dependencies**: Task 6 (usage service, chart components)

---

## Task 15: Org — Developer Portal & API Keys

**Issue Type**: Task  
**Epic**: FE-EP3  
**Summary**: Build API key management, webhook configuration, sandbox panel, and API docs  
**Story Points**: 13  
**Priority**: High  
**Description**:

```
Developer portal — PRD §6.2.3 + §8.4:

API Key Management:
1. Generate API key (choose sandbox/production, enter name)
2. Show full key ONCE on creation with copy-to-clipboard
3. API key list: masked prefix, name, environment, status, last used
4. Revoke key with confirmation dialog

Webhooks & Integration:
5. Webhook configuration (set callback URLs per event type)
6. Test webhook button (sends test payload, shows response)
7. IP whitelist management (P1)

Developer Experience:
8. API documentation link or embedded Swagger viewer
9. Sandbox testing panel (try API calls from browser)
10. API logs viewer (recent requests, status codes, response times)

Files:
- app/(org)/developers/page.tsx (rebuild with tabs)
- lib/api-key-service.ts (new)
```

**Acceptance Criteria**:

- [ ] Generate key with name and environment selection
- [ ] Full key displayed once with copy button
- [ ] Key list shows masked keys with status and last used
- [ ] Revoke with confirmation
- [ ] Webhook URL configurable and testable
- [ ] API docs accessible
- [ ] API logs show recent requests

**Dependencies**: Backend API key and webhook endpoints

---

## Task 16: Org — Team Management & Settings

**Issue Type**: Task  
**Epic**: FE-EP3  
**Summary**: Build team invite/management and org settings pages  
**Story Points**: 10  
**Priority**: High  
**Description**:

```
Team management — PRD §6.2.4 + Org settings:

Team:
1. Invite user form (email, name, role label selection)
2. User list: name, email, role label, status, last login (paginated)
3. Role labels: Admin, Credit Officer, Developer, Viewer
4. Assign/change role label
5. Remove user with confirmation dialog
6. Pending invitations list
7. User activity log

Settings:
8. Organization profile editing (name, address, contacts)
9. Security settings (2FA enforcement for org)
10. Notification preferences (email alerts toggle)

Files:
- app/(org)/team/page.tsx (rebuild)
- app/(org)/settings/page.tsx (rebuild)
- lib/team-service.ts (new)
```

**Acceptance Criteria**:

- [ ] Invite form sends email invitation
- [ ] User list with pagination and role labels
- [ ] Role label assignable/changeable
- [ ] Remove user with confirmation
- [ ] Pending invites shown separately
- [ ] Org profile editable and saves
- [ ] Notification preferences toggleable

**Dependencies**: Backend team management API

---

## Task 17: Testing, Accessibility & Performance

**Issue Type**: Task  
**Epic**: FE-EP4  
**Summary**: Write tests (unit, integration, E2E), achieve WCAG 2.1 AA, and optimize performance  
**Story Points**: 21  
**Priority**: High  
**Description**:

```
Quality assurance across the full application:

Testing:
1. Test framework setup (Vitest + React Testing Library)
2. Unit tests for key components (forms, tables, modals)
3. Unit tests for service layers (mocked API)
4. Integration tests for auth and scoring flows
5. E2E tests with Playwright (login, new score request, org management)
6. Coverage target: >80%

Accessibility:
7. axe-core accessibility audit
8. Keyboard navigation for all interactive elements
9. ARIA labels on all controls
10. Color contrast compliance
11. Screen reader testing
12. Focus management (modal traps, skip links)

Performance:
13. Code splitting / lazy loading for route-level chunks
14. Bundle analysis and optimization
15. Font optimization (Google Fonts: Inter/Roboto)
16. Image optimization (Next.js Image throughout)
17. Caching strategies
18. Target: Lighthouse >90, FCP <1.5s

Responsive Design:
19. All tables responsive (scroll or stack on mobile)
20. All forms responsive
21. All dashboard charts resize properly
22. Tablet breakpoint testing
```

**Acceptance Criteria**:

- [ ] Test framework configured and running
- [ ] Component and service tests written
- [ ] E2E tests pass for critical flows (login, scoring, org CRUD)
- [ ] Coverage >80%
- [ ] WCAG 2.1 AA audit passes
- [ ] Keyboard navigation works everywhere
- [ ] Screen reader compatible
- [ ] Lighthouse Performance >90
- [ ] No horizontal overflow on mobile
- [ ] Charts and forms responsive

---

## Task 18: Monitoring, CI/CD & Deployment

**Issue Type**: Task  
**Epic**: FE-EP4  
**Summary**: Set up Sentry error tracking, CI/CD pipeline, and production deployment to Azure  
**Story Points**: 10  
**Priority**: High  
**Description**:

```
Production readiness:

Monitoring:
1. Install and configure Sentry for error tracking
2. Add error boundaries per route section
3. Performance monitoring
4. Standardized API error toasts across app

CI/CD & Deployment:
5. Build pipeline configuration (lint, test, build on push)
6. Environment variable management (staging vs production)
7. Production deployment to Azure (Static Web Apps or App Service)
8. SSL/TLS and custom domain setup
9. Smoke tests post-deploy
```

**Acceptance Criteria**:

- [ ] Sentry capturing frontend errors
- [ ] Error boundaries in place per route section
- [ ] Standardized error toasts for API failures
- [ ] CI/CD pipeline runs lint + test + build on push
- [ ] Env vars managed per environment
- [ ] Production deployed and accessible on Azure
- [ ] Smoke tests pass post-deploy

**Dependencies**: Azure access from PaySwitch

---

## Summary

| #   | Task                             | Points  | Status      | Suggested Timeline |
| --- | -------------------------------- | ------- | ----------- | ------------------ |
| 1   | Project Foundation & UI Library  | 21      | ✅ Done     | —                  |
| 2   | Authentication Pages & Service   | 10      | ✅ Done     | —                  |
| 3   | Admin: Organization Management   | 26      | ✅ Done     | —                  |
| 4   | Admin: Training Data Management  | 13      | ✅ Done     | —                  |
| 5   | Org: Score Requests Core         | 26      | ✅ Done     | —                  |
| 6   | Shared Components & Services     | 13      | To Do       | Week 1–2           |
| 7   | Auth: 2FA, Activation & Guards   | 13      | To Do       | Week 2–3           |
| 8   | Admin: Org Detail Enhancement    | 8       | To Do       | Week 3             |
| 9   | Admin: Data Quality & Models     | 21      | To Do       | Week 3–5           |
| 10  | Admin: Dashboard & Analytics     | 13      | To Do       | Week 5–6           |
| 11  | Admin: AI Monitor, Compliance    | 21      | To Do       | Week 6–8           |
| 12  | Org: Score Request Enhancement   | 21      | To Do       | Week 4–6           |
| 13  | Org: Bulk Scoring                | 13      | To Do       | Week 7–8           |
| 14  | Org: Dashboard & Reports         | 13      | To Do       | Week 6–7           |
| 15  | Org: Developer Portal & API Keys | 13      | To Do       | Week 7–8           |
| 16  | Org: Team Management & Settings  | 10      | To Do       | Week 8–9           |
| 17  | Testing, A11y & Performance      | 21      | To Do       | Week 9–11          |
| 18  | Monitoring, CI/CD & Deployment   | 10      | To Do       | Week 11–12         |
|     | **Total**                        | **285** | **96 done** |                    |
