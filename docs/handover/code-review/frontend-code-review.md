# Frontend Code-Review Report — PaySwitch Credit Scoring Platform

|                            |                                                          |
| -------------------------- | -------------------------------------------------------- |
| **Repository / component** | Frontend web application                                 |
| **Stack**                  | Next.js 16 (App Router), React 19, TypeScript 5 (strict) |
| **Owner**                  | Frontend Engineering Team                                |
| **Branch reviewed**        | `develop`                                                |

---

## 1. Review process

| Aspect                    | Detail                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Review unit               | Pull request to `develop` / `main`                                                                   |
| Required checks (CI gate) | `tsc --noEmit`, ESLint, Vitest (unit + integration with coverage), Playwright E2E — `.github/workflows/ci.yml` |
| Merge policy              | PR must pass the `static-checks` matrix (typecheck, lint, test); Playwright E2E runs before merge     |
| Enforcement              | CI is a required gate — non-passing changes cannot merge                                              |

---

## 2. Standards & conventions enforced

- **TypeScript strict mode** — no implicit `any` at the compiler level; `tsc --noEmit` runs on every PR.
- **ESLint flat config** (`eslint.config.mjs`) extending `eslint-config-next` core-web-vitals + TypeScript + jsx-a11y rules.
- **Typed domain model** — shared types in `src/types/` (`models.ts`, `auth-type.ts`, `api-type.ts`, `rbac-types.ts`, `monitoring-types.ts`, …) keep service and component layers consistent.
- **Validation co-located** — all input validation expressed as `zod` schemas in `src/lib/schemas/`, reused by `react-hook-form` resolvers.
- **Service-layer separation** — all backend calls go through `src/lib/*-service.ts` modules over a single `axios` instance; components never call `axios` directly.
- **Server/client isolation** — server-only concerns (session, config, proxy) are marked `import "server-only"` and guarded by a Vitest stub (`tests/setup/server-only-stub.ts`) that fails the build on accidental client import.
- **Query-key factory** — centralized in `src/lib/query-client.tsx` to prevent cache-key drift across TanStack Query usages.

---

## 3. Review dimensions & outcomes

### 3.1 Architecture & structure
- Clear App Router segmentation into `(auth)`, `(org)`, `(admin)` route groups, each with its own layout and error boundary. **Confirmed sound.**
- Server-only modules isolated behind route handlers and `src/lib/server-*.ts`. **Confirmed sound.**

### 3.2 Security-sensitive code
- Auth tokens handled exclusively server-side (HttpOnly `__Host-session` cookie); browser code holds no token or refresh logic. **Confirmed** — detailed in the security-controls report.
- No `dangerouslySetInnerHTML` / `innerHTML` anywhere in the codebase. **Confirmed.**
- No client-exposed secrets: no `NEXT_PUBLIC_*` usage; `BACKEND_API_URL` is server-only. **Confirmed.**

### 3.3 Error handling & resilience
- Centralized error normalization in `src/lib/api-client.ts` produces a consistent `ApiError` shape and maps every status class to user-safe messaging. **Confirmed** and covered by `tests/lib/api-client.test.ts`.
- Global and per-segment error boundaries present and isolate failures to their route. **Confirmed.**

### 3.4 State management
- Server state via TanStack Query with an explicit retry/stale policy; auth and theme via React Context. Separation is clean and consistent. **Confirmed.**

### 3.5 Type safety
- Strict TypeScript across the codebase with a shared, typed domain model; `tsc --noEmit` is a required CI check. **Confirmed.**

### 3.6 Test coverage
- Automated tests accompany the security- and correctness-critical modules: the authenticated proxy, edge-middleware route isolation, RBAC UI gating (admin + org), the API client, form schemas, auth context, and the browser session cache. Coverage thresholds are enforced by the CI test job. **Confirmed.**

---

## 4. Items reviewed and accepted (no change required)

- HttpOnly `__Host-` cookie session design and server-side token attach.
- Same-origin proxy architecture — no CORS surface exposed to the browser.
- Centralized axios error normalization with status-derived UX flags.
- Security headers applied at both the framework and edge-proxy layers.
- zod-based validation co-located and reused across forms.
- Route-group segmentation with per-segment error isolation and non-leaking 404 rewrites for wrong-scope access.
- Server/client boundary enforced at build time.

---

## 5. Outcome

The frontend repository passes its full automated quality gate — strict typecheck, lint (including accessibility rules), unit/integration tests with enforced coverage, and end-to-end tests — as a required condition for merge. The review confirmed a consistent architecture, a clean server/client trust boundary, centralized and tested error handling, and no unsafe rendering or secret-exposure patterns. No blocking issues were identified.
