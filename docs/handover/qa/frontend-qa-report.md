# Frontend QA Report — PaySwitch Credit Scoring Platform

|               |                                                          |
| ------------- | -------------------------------------------------------- |
| **Component** | Frontend web application                                 |
| **Stack**     | Next.js 16 (App Router), React 19, TypeScript 5 (strict) |
| **Owner**     | Frontend Engineering Team                                |

---

## 1. Test approach & tooling

| Layer              | Tool                                                                                | Location                                    |
| ------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| Unit / integration | Vitest 4 + Testing Library + happy-dom                                              | `tests/`, `vitest.config.ts`                |
| API mocking        | MSW (Mock Service Worker)                                                            | `tests/setup/vitest.setup.ts`               |
| End-to-end         | Playwright 1.59 against the production build (`next build && next start`)            | `tests/e2e/`, `playwright.config.ts`        |
| Coverage           | `@vitest/coverage-v8`, enforced as a CI gate                                         | `vitest.config.ts`                          |
| Static checks      | `tsc --noEmit`, ESLint 9 (flat config, `eslint-config-next` core-web-vitals + a11y) | `eslint.config.mjs`, `tsconfig.json`        |
| CI gate            | GitHub Actions — typecheck, lint, test (matrix) + Playwright E2E                     | `.github/workflows/ci.yml`                  |

**Automated test suites present** (14 Vitest specs + Playwright E2E):

| Area under test | Spec |
| --- | --- |
| Login route handler | `tests/api/auth-login.test.ts` |
| Backend proxy route (token attach / refresh / forward) | `tests/api/proxy-route.test.ts` |
| Admin RBAC UI gating | `tests/components/admin/admin-rbac-gating.test.tsx` |
| Org RBAC UI gating | `tests/components/org/org-rbac-gating.test.tsx` |
| Auth context (login/logout/session) | `tests/contexts/auth-context.test.tsx` |
| Permission hook | `tests/hooks/use-permissions.test.tsx` |
| Debounce hook | `tests/hooks/use-debounce.test.tsx` |
| API client error normalization | `tests/lib/api-client.test.ts` |
| Scoring service | `tests/lib/score-service.test.ts` |
| Form schemas (settings, team) | `tests/lib/schemas/*.test.ts` |
| Browser session cache | `tests/lib/session-storage.test.ts` |
| Edge middleware / route isolation | `tests/proxy.test.ts` |
| End-to-end auth & routing | `tests/e2e/auth.spec.ts` |

E2E specs seed the session cookie directly so RBAC routing and the proxy are exercised against the production build without depending on a live backend.

---

## 2. Browser & responsive testing

**Approach:** Tailwind CSS 4 utility breakpoints (`sm:` / `md:` / `lg:`) plus container queries (`@md/field-group`). Theme handled via `next-themes` (light / dark / system) with CSS custom properties in `src/app/globals.css`.

| Area                                       | Result       | Evidence |
| ------------------------------------------ | ------------ | -------- |
| Responsive layout (mobile / tablet / desktop breakpoints) | ✅ Implemented | Tailwind responsive utilities + container queries throughout `src/components/` |
| Light / dark / system theme                | ✅ Implemented | `next-themes`, theme-aware CSS variables in `globals.css` (risk categories, charts, sidebar) |
| End-to-end run on production build (Chromium) | ✅ Automated | Playwright runs against `next build && next start` on an isolated `distDir` |

---

## 3. Role-based UI visibility

**Mechanism:** RBAC is enforced in three layers — edge middleware (`src/proxy.ts`), client guards (`src/contexts/auth-context.tsx`), and permission checks (`src/hooks/use-permissions.ts` against codes in `src/lib/constant.ts`).

| Behaviour                                  | Expected                       | Result |
| ------------------------------------------ | ------------------------------ | ------ |
| Org user cannot reach admin routes         | Rewritten to 404 (route existence not leaked) | ✅ Enforced (`src/proxy.ts`) + tested (`tests/proxy.test.ts`) |
| Admin user cannot reach org routes         | Rewritten to 404               | ✅ Enforced (`src/proxy.ts`) + tested |
| Authenticated user on an auth page         | Redirected to their own dashboard | ✅ Enforced (`src/proxy.ts`) |
| Unauthenticated user on a protected route  | Redirected to the correct login, original path preserved as `?next=` | ✅ Enforced (`src/proxy.ts`) |
| UI elements gated by permission code       | Hidden when the permission is absent | ✅ Implemented + tested (`admin-rbac-gating`, `org-rbac-gating`) |

> **Note:** Client-side permission checks are a UX convenience; the authoritative check is server-side (proxy + backend). This trust boundary is documented in the security-controls report.

---

## 4. Forms & validation

**Mechanism:** `react-hook-form` 7 + `zod` 4 via `@hookform/resolvers`. Schemas live in `src/lib/schemas/`: `batch-scoring`, `admin-management`, `organization-management`, `developer-training-management`, `settings-management`, `team-management`.

| Capability                                                                    | Result |
| ----------------------------------------------------------------------------- | ------ |
| Schema-based validation co-located and reused across forms                    | ✅ Implemented (`src/lib/schemas/`) |
| Format validation (dates `YYYY-MM-DD`, phone `+?[0-9]{10,15}`, length bounds) | ✅ Implemented (zod schemas) |
| Cross-field refinements (e.g. batch row requires name OR ID OR phone)         | ✅ Implemented (`batch-scoring.ts`) |
| Inline error display with `role="alert"` / `aria-invalid`                     | ✅ Implemented (`src/components/ui/field.tsx`) |
| Schema validation covered by automated tests                                  | ✅ Tested (`tests/lib/schemas/`) |
| Server-side validation errors (422) surfaced to the correct field            | ✅ Implemented — `api-client.ts` parses both FastAPI array-form and spec string-form 422s and maps the offending field |

---

## 5. Loading / error / empty states

| State               | Implementation                                                                                      | Result |
| ------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Loading             | Next `loading.tsx` (root + segments), `Skeleton` components, TanStack Query `isPending`/`isLoading` | ✅ Implemented |
| Error (global)      | `src/app/global-error.tsx`                                                                          | ✅ Implemented |
| Error (per segment) | `src/app/(org)/error.tsx`, `src/app/(admin)/error.tsx` — keep shell interactive, provide retry     | ✅ Implemented |
| Not-found           | Styled `not-found.tsx`; wrong-scope access served the same page without leaking route existence     | ✅ Implemented |
| Retry policy        | React Query: 4xx no retry, 5xx up to 3 retries; `staleTime` 5 min, `gcTime` 10 min                  | ✅ Configured (`src/lib/query-client.tsx`) |
| User feedback       | Toast notifications via `sonner`                                                                    | ✅ Implemented (`src/components/ui/sonner.tsx`) |

---

## 6. Accessibility

**Tooling:** `eslint-plugin-jsx-a11y` (via `eslint-config-next`), enforced in CI lint. UI primitives are Radix-based, providing native semantics for dialogs, tabs, menus, and buttons.

| Check                                                      | Result |
| ---------------------------------------------------------- | ------ |
| Form labels associated (`htmlFor` / `id`)                  | ✅ Implemented |
| `aria-invalid` on invalid fields, `role="alert"` on errors | ✅ Implemented (`field.tsx`) |
| `role="group"` on field groups, `role="separator"` on OTP separators | ✅ Implemented |
| Decorative elements marked `aria-hidden`                   | ✅ Implemented |
| Native focus management on dialogs / menus                 | ✅ Provided by Radix primitives |
| a11y lint rules enforced on every PR                       | ✅ CI gate |

---

## 7. Session expiry & logout

| Behaviour                       | Detail                                                                              | Result |
| ------------------------------- | ----------------------------------------------------------------------------------- | ------ |
| Inactivity timeout              | Auto-logout after 10 min idle; timer reset on mousemove/keydown/click/scroll/touchstart | ✅ Implemented (`INACTIVITY_TIMEOUT_MS`, `src/contexts/auth-context.tsx`) |
| Token refresh on 401            | Proxy refreshes once and retries the original request                               | ✅ Implemented (`src/app/api/proxy/[...path]/route.ts`) |
| Refresh failure                 | Proxy returns 401 → client redirects to `/login`                                    | ✅ Implemented (`api-client.ts`) |
| Explicit logout                 | Clears `__Host-session` cookie (maxAge 0 with full attributes), invalidates upstream, redirects | ✅ Implemented (`server-session.ts`, `auth-service.ts`) |
| Cookie lifetime                 | 7-day max age, slides on each refresh                                               | ✅ Configured (`server-session.ts`) |
| Session flow covered by tests   | —                                                                                   | ✅ Tested (`tests/contexts/auth-context.test.tsx`) |

---

## 8. Authentication flows

| Flow                          | Result |
| ----------------------------- | ------ |
| Email/password login (org + admin portals) | ✅ Implemented + tested (`tests/api/auth-login.test.ts`) |
| Two-factor authentication (OTP) | ✅ Implemented (`input-otp`, `qrcode.react`, `src/app/api/auth/2fa/`, `/verify`) |
| Forgot password / reset password | ✅ Implemented (`(auth)/forgot-password`, `(auth)/reset-password`) |
| Profile hydration (`/api/auth/me` as source of truth) | ✅ Implemented |

---

## 9. API integration

**Mechanism:** Browser `axios` calls `/api/proxy/...` (same-origin, no CORS). The Next route handler attaches the Bearer token server-side and forwards to `BACKEND_API_URL`.

| Capability                                                                      | Result |
| ------------------------------------------------------------------------------- | ------ |
| Single axios instance, 30s timeout, same-origin with credentials                | ✅ Implemented (`src/lib/api-client.ts`) |
| Service-layer separation (all calls via `src/lib/*-service.ts`)                 | ✅ Implemented |
| Normalized `ApiError` shape for network / 4xx / 5xx                             | ✅ Implemented + tested (`tests/lib/api-client.test.ts`) |
| Network-error taxonomy (timeout / offline / connection refused → friendly copy) | ✅ Implemented |
| Status-derived flags: `forbidden` (403), `notFound` (404), `retryable` (502/503), `retryAfter` (429) | ✅ Implemented |
| 401 on a non-auth endpoint → redirect to `/login`                               | ✅ Implemented |

---

## 10. Summary

The frontend ships with an automated quality gate on every pull request — TypeScript strict typecheck, ESLint (including accessibility rules), a 14-spec Vitest suite with enforced coverage, and a Playwright end-to-end run against the production build. RBAC isolation, the authenticated proxy, API error handling, form schemas, and the browser session cache are all covered by automated tests. Authentication (including 2FA), session lifecycle, responsive theming, and resilient loading/error states are implemented and verified against the codebase.
