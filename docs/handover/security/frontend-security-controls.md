# Frontend Security Controls — Payswitch Credit Scoring Platform

|                       |                                                             |
| --------------------- | ----------------------------------------------------------- |
| **Component**         | Frontend web application                                    |
| **Stack**             | Next.js 16 (App Router), React 19, TypeScript 5 (strict)    |
| **Owner**             | Frontend Engineering Team                                   |
| **Consolidated into** | `security/security-controls.md`                              |

---

## 1. Secure token handling

| Control                                                                                                                       | Status         | Evidence                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------- |
| Tokens stored in a **HttpOnly, Secure, SameSite=Strict** cookie with the `__Host-` prefix                                    | ✅ Implemented | `src/lib/server-session.ts`                                                       |
| Browser JavaScript never reads or holds access/refresh tokens                                                                | ✅ Implemented | Tokens live only in the server-side cookie; `api-client.ts` carries no token logic |
| Bearer token attached **server-side** in the proxy, not in browser code                                                      | ✅ Implemented | `src/app/api/proxy/[...path]/route.ts`                                            |
| Refresh-on-401 with a single retry, then forced logout                                                                       | ✅ Implemented | proxy route handler + `api-client.ts`                                             |
| 7-day session max age, sliding on each refresh                                                                               | ✅ Implemented | `src/lib/server-session.ts`                                                       |
| Cookie fully cleared on logout (empty value, `maxAge 0`, full `__Host-` attributes)                                          | ✅ Implemented | `clearServerSession()` in `server-session.ts`                                     |
| Inactivity auto-logout after 10 minutes idle                                                                                 | ✅ Implemented | `INACTIVITY_TIMEOUT_MS`, `src/contexts/auth-context.tsx`                          |
| Browser localStorage cache holds **non-sensitive render hints only** (never tokens)                                          | ✅ Implemented | `src/lib/session-storage.ts`; source of truth is `/api/auth/me`                   |

**Posture:** The `__Host-` prefix locks the cookie to the origin (Secure required, `Path=/`, no `Domain`). Because tokens never enter JavaScript-reachable storage, they are structurally inaccessible to client-side script.

---

## 2. XSS prevention

| Control                                                     | Status          | Evidence                          |
| ----------------------------------------------------------- | --------------- | --------------------------------- |
| No `dangerouslySetInnerHTML` in the codebase                | ✅ Verified     | No occurrences                    |
| No `innerHTML` assignment in the codebase                   | ✅ Verified     | No occurrences                    |
| All rendering through React's auto-escaping JSX             | ✅ By framework | —                                 |
| All user input validated via zod schemas before submission | ✅ Implemented  | `src/lib/schemas/`                |
| `Content-Security-Policy: frame-ancestors 'none'`           | ✅ Implemented  | `next.config.ts`, `src/proxy.ts`  |

---

## 3. CSP & security headers

Applied at **two layers** — framework (`next.config.ts`) and edge proxy (`src/proxy.ts`) — so a path that ever slips past the proxy matcher is still covered:

| Header                      | Value                                                                              | Purpose                                            |
| --------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`                                     | Force HTTPS (2 yrs, preload-ready)                 |
| `X-Frame-Options`           | `DENY`                                                                             | Clickjacking protection                            |
| `Content-Security-Policy`   | `frame-ancestors 'none'`                                                           | Clickjacking defence-in-depth                      |
| `X-Content-Type-Options`    | `nosniff`                                                                          | Block MIME sniffing                                |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                                  | Limit referrer leakage                             |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` | Disable unused powerful features + opt out of FLoC |
| `X-DNS-Prefetch-Control`    | `off`                                                                              | Reduce passive information leakage                 |

---

## 4. Dependency & supply-chain integrity

| Control                                          | Status         | Evidence            |
| ------------------------------------------------ | -------------- | ------------------- |
| Committed lockfile for reproducible installs     | ✅ Implemented | `package-lock.json` |
| Pinned, versioned dependency set                 | ✅ Implemented | `package.json`      |

---

## 5. Sensitive-data masking

| Control                                                           | Status         | Evidence                                       |
| ----------------------------------------------------------------- | -------------- | ---------------------------------------------- |
| Tokens never logged or placed in browser storage                  | ✅ Implemented | HttpOnly cookie only                           |
| API keys masked after creation (`keyPrefix`; full key shown once) | ✅ Implemented | Settings / API-key UI                          |
| localStorage render cache excludes sensitive fields               | ✅ Implemented | `src/lib/session-storage.ts`                   |
| API request logging gated to development only                     | ✅ Implemented | `[API] …` logs guarded by `NODE_ENV` in `api-client.ts` |

---

## 6. Route guards

| Control                                                                                                              | Status         | Evidence                                              |
| ------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------- |
| Edge middleware classifies routes (auth/admin/org/public) and enforces access by `userType` from the session cookie | ✅ Implemented | `src/proxy.ts`                                        |
| Cross-portal access blocked; wrong-scope requests rewritten to 404 **without leaking route existence**              | ✅ Implemented | `src/proxy.ts` (`rewriteToNotFound`)                  |
| Login redirects preserve the original path as an **internal-only** `?next=` value                                   | ✅ Implemented | `src/proxy.ts` (`redirectToLogin`)                    |
| Client guards (`useRequireAuth`, `useRequireAdmin`)                                                                  | ✅ Implemented | `src/contexts/auth-context.tsx`                       |
| Permission-code checks for UI gating                                                                                 | ✅ Implemented | `src/hooks/use-permissions.ts`, `src/lib/constant.ts` |
| Route isolation & RBAC gating covered by automated tests                                                            | ✅ Tested      | `tests/proxy.test.ts`, `tests/components/*/*-rbac-gating.test.tsx` |

> **Design note:** Client-side guards and permission checks are **UX controls**. Authorization is authoritative server-side (proxy + backend), which re-checks every request's bearer token. This is the intended trust boundary.

---

## 7. Secrets & build hygiene

| Control                                                                  | Status         | Evidence                                                |
| ------------------------------------------------------------------------ | -------------- | ------------------------------------------------------- |
| No `NEXT_PUBLIC_*` / `VITE_*` secret exposure                            | ✅ Verified    | No client-exposed env prefixes in use                   |
| `BACKEND_API_URL` is server-only                                         | ✅ Implemented | `src/lib/server-config.ts`, read only by route handlers |
| `.env.local` git-ignored; `.env.example` documents required config       | ✅ Implemented | `.gitignore`, `.env.example`                            |
| Production browser source maps not shipped to clients                    | ✅ Verified    | Next.js default; not enabled in `next.config.ts`        |
| Deploy secrets via OIDC federated credentials (no static client secrets) | ✅ Implemented | `.github/workflows/deploy.yml` (Azure OIDC)             |

---

## 8. Summary

Frontend security rests on a strong structural foundation: authentication tokens live only in an origin-locked HttpOnly cookie and are attached server-side, so they are unreachable from client script; there are no unsafe HTML-rendering sinks; a full set of security headers is applied at two independent layers; route and portal isolation is enforced in edge middleware and covered by automated tests; and no secrets or production source maps reach the client bundle. All controls listed above are implemented in the codebase at the referenced locations.
