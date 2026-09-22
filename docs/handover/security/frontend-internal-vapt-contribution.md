# Frontend Contribution — Internal Security Assessment

|                               |                                                 |
| ----------------------------- | ----------------------------------------------- |
| **Component**                 | Frontend / browser-client exposure              |
| **Stack**                     | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Owner**                     | Frontend Engineering Team (contributor)         |
| **Internal VAPT coordinator** | Backend Engineering Team                        |

---

## 1. Test areas (frontend remit)

Per the ownership split, the frontend team covers the following client-exposure categories:

1. Cross-Site Scripting (XSS)
2. Cross-Site Request Forgery (CSRF), where applicable
3. Clickjacking
4. Open redirects
5. Client-side authorization assumptions
6. Sensitive browser storage
7. Information leakage through logs or source maps

---

## 2. Findings by category

### 2.1 Cross-Site Scripting (XSS)

| Control verified                                             | Result |
| ----------------------------------------------------------- | ------ |
| No `dangerouslySetInnerHTML` sink anywhere in the codebase   | ✅     |
| No `innerHTML` assignment anywhere in the codebase           | ✅     |
| All output rendered through React's auto-escaping JSX        | ✅     |
| All user input validated against zod schemas before use      | ✅     |

**Assessment:** No client-side XSS sink is present. Output encoding is handled by React by default and there are no raw-HTML injection points.

---

### 2.2 CSRF (where applicable)

| Control verified                                                                                          | Result |
| --------------------------------------------------------------------------------------------------------- | ------ |
| Session cookie is `SameSite=Strict` with the `__Host-` prefix                                             | ✅     |
| State-changing calls go through a **same-origin** proxy (`/api/proxy`); no cross-origin browser API surface | ✅     |
| `api-client` uses `withCredentials` against same-origin only — no third-party origin receives the cookie   | ✅     |

**Assessment:** `SameSite=Strict` combined with the same-origin proxy boundary removes the classic cross-site request-forgery vector — a third-party origin cannot cause the browser to attach the session cookie to a state-changing request.

---

### 2.3 Clickjacking

| Control verified                                    | Result |
| --------------------------------------------------- | ------ |
| `X-Frame-Options: DENY` on framework + proxy layers | ✅     |
| `Content-Security-Policy: frame-ancestors 'none'`   | ✅     |

**Assessment:** The application cannot be framed by any origin. Protection is applied twice (framework config and edge proxy) as defence in depth.

---

### 2.4 Open redirects

| Control verified                                                                                                  | Result |
| ----------------------------------------------------------------------------------------------------------------- | ------ |
| Login redirect stores only the request's own `pathname + search` as `?next=` — never an attacker-supplied absolute URL | ✅     |
| All middleware redirects are constructed against `request.nextUrl` (same-origin base)                             | ✅     |
| Wrong-scope access is served via an internal 404 rewrite, not an external redirect                                | ✅     |

**Assessment:** Redirect targets are constrained to internal, same-origin paths. There is no user-controlled absolute-URL redirect path. Reference: `src/proxy.ts` (`redirectToLogin`, `rewriteToNotFound`).

---

### 2.5 Client-side authorization assumptions

| Control verified                                                                                            | Result |
| ----------------------------------------------------------------------------------------------------------- | ------ |
| Authorization enforced server-side: edge proxy gates routes by `userType`; backend re-checks every request's bearer token | ✅     |
| Client-side guards / permission checks are treated as **UX only** — no security decision depends on them    | ✅     |
| Cross-portal isolation (org↔admin) enforced server-side and covered by automated tests                      | ✅     |

**Assessment:** No trust is placed in the client for authorization. Tampering with the browser can at most alter cosmetic UI; it cannot yield privileged data or actions, because the proxy and backend re-verify server-side. Reference: `src/proxy.ts`, `tests/proxy.test.ts`, `tests/components/*/*-rbac-gating.test.tsx`.

---

### 2.6 Sensitive browser storage

| Control verified                                                                | Result |
| ------------------------------------------------------------------------------- | ------ |
| Access/refresh tokens are **never** in localStorage, sessionStorage, or IndexedDB | ✅     |
| Tokens reside only in the HttpOnly `__Host-session` cookie                        | ✅     |
| localStorage cache holds only non-sensitive render hints and is cleared on logout | ✅     |

**Assessment:** No secret material is reachable from client-side storage. Reference: `src/lib/server-session.ts`, `src/lib/session-storage.ts`.

---

### 2.7 Information leakage (logs / source maps)

| Control verified                                                        | Result |
| ----------------------------------------------------------------------- | ------ |
| API request logging is gated to development only (`NODE_ENV`)           | ✅     |
| Production browser source maps are not shipped (Next.js default; not enabled) | ✅     |
| No secrets or internal URLs in the client bundle (`BACKEND_API_URL` server-only; no `NEXT_PUBLIC_*`) | ✅     |
| Error boundaries render user-safe messages, not internal stack traces    | ✅     |

**Assessment:** The production build does not expose source maps, secrets, internal hostnames, or verbose diagnostics to the client.

---

## 3. Summary

Across all seven client-exposure categories in the frontend remit, the reviewed controls are in place: no XSS sinks, `SameSite=Strict` + same-origin CSRF protection, double-layered clickjacking defence, internal-only redirect handling, server-authoritative authorization with tested portal isolation, no secret material in browser storage, and no production information leakage. These control verifications feed the consolidated internal security assessment coordinated by the Backend Engineering team.
