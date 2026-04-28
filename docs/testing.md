# Testing

Two complementary suites cover the frontend:

| Suite | Tool | Scope | Where |
|---|---|---|---|
| **Unit / integration** | Vitest + Testing Library + MSW | services, hooks, contexts, schemas, proxy middleware | `tests/**/*.test.{ts,tsx}` |
| **End-to-end** | Playwright | auth flow, portal isolation, security headers, smoke navigation | `tests/e2e/**/*.spec.ts` |

Both run on Node 20+ and have no platform-specific requirements.

---

## 1. Quick reference

```bash
# Unit / integration
npm run test                # one-shot
npm run test:watch          # watch mode while writing tests
npm run test:coverage       # produces coverage/ + thresholds gate

# End-to-end
npm run test:e2e            # headless (default port 3100)
npm run test:e2e:ui         # Playwright UI for debugging

# Other
npm run typecheck           # tsc --noEmit
npm run lint                # eslint
```

Coverage report is HTML (`coverage/index.html`) plus LCOV (`coverage/lcov.info`) for CI tooling.

---

## 2. Unit / integration suite (Vitest)

### Stack

- **[Vitest 4](https://vitest.dev/)** — fast, native ESM/TS test runner.
- **[happy-dom](https://github.com/capricorn86/happy-dom)** — lightweight DOM env (faster than jsdom; sufficient for Testing Library).
- **[Testing Library](https://testing-library.com/)** + `user-event` for component interactions.
- **[MSW v2](https://mswjs.io/)** — request-level network mocking. We test the real `apiClient` axios interceptors, not a stub.
- **[@vitest/coverage-v8](https://vitest.dev/guide/coverage)** — V8 coverage with HTML + LCOV output.

### Layout

```
tests/
├── setup/
│   ├── vitest.setup.ts        # global lifecycle, env stubs, polyfills
│   ├── msw-server.ts          # shared MSW server
│   ├── msw-handlers.ts        # canonical happy-path handlers
│   ├── render.tsx             # renderWithProviders helper
│   ├── server-only-stub.ts    # stub for "server-only" import in JSDOM
│   └── scaffold.test.ts       # smoke test confirming the harness is wired
├── lib/
│   ├── api-client.test.ts
│   ├── score-service.test.ts
│   ├── session-storage.test.ts
│   └── schemas/
│       ├── settings-management.test.ts
│       └── team-management.test.ts
├── api/                       # Next Route Handler tests (server-side)
│   ├── auth-login.test.ts
│   └── proxy-route.test.ts
├── components/
│   ├── admin/admin-rbac-gating.test.tsx
│   └── org/org-rbac-gating.test.tsx
├── hooks/
│   ├── use-debounce.test.tsx
│   └── use-permissions.test.tsx
├── contexts/
│   └── auth-context.test.tsx
├── proxy.test.ts
└── e2e/
    └── auth.spec.ts           # Playwright portal-isolation specs
```

### Conventions

- **One test file mirrors one source file.** Keeps it easy to find tests for a given module.
- **Use `renderWithProviders` from `tests/setup/render.tsx`** when a component needs `QueryClientProvider`. It returns `{ user, ...rtlUtils }` with a pre-configured `userEvent`.
- **Mock at the module boundary, not the function.** `vi.mock("@/contexts/auth-context", () => ({ useAuth: () => fakeState }))` is preferred over patching `useContext`.
- **Network mocking is MSW-only.** Don't mock axios methods directly — testing the real interceptors is the whole point.
- **Default handlers in `msw-handlers.ts` cover happy paths.** Override per-case with `server.use(http.get(...))` inside a test. The shared server is reset between tests.
- **Storage is wiped in `afterEach`** by the setup file. Tests can assume a clean `localStorage` and no cookies on entry.
- **`@/`** path alias works in tests via `resolve.tsconfigPaths: true` in `vitest.config.ts`.

### Adding a new test — the recipe

```ts
// tests/lib/foo-service.test.ts
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup/msw-server";
import { fooService } from "@/lib/foo-service";

const API = "http://api.test/api";

describe("fooService.getFoos", () => {
  it("maps snake_case to camelCase", async () => {
    server.use(
      http.get(`${API}/v1/foos`, () =>
        HttpResponse.json({ items: [{ foo_id: "f-1" }] }),
      ),
    );

    const result = await fooService.getFoos();
    expect(result.items[0].fooId).toBe("f-1");
  });
});
```

### What's covered today

| File | Notes |
|---|---|
| `src/lib/schemas/settings-management.ts` | change-password, 2FA verify/remove, org profile zod schemas |
| `src/lib/schemas/team-management.ts` | invite + edit org user schemas |
| `src/lib/score-service.ts` | snake↔camel mapping, `decision` filter (string + array), stats endpoint, `null` trend, query-key uniqueness |
| `src/lib/session-storage.ts` | non-sensitive `localStorage` user-cache round-trip, missing/malformed entries, clear semantics |
| `src/lib/api-client.ts` | base-URL points at `/api/proxy`, **no** Authorization header on the wire (proxy attaches it server-side), FastAPI 422 + nested errors + status fallbacks + network errors |
| `src/hooks/use-debounce.ts` | initial value, delay, collision-with-rapid-changes, default delay |
| `src/hooks/use-permissions.ts` | empty list, exact-code match, `*` wildcard, mock users, isLoading semantics |
| `src/contexts/auth-context.tsx` | hydration (anon, org, admin), `/auth/me` failure fallback, setSession, logout, mock seeding |
| `src/proxy.ts` | every route-zone branch (auth/admin/org/public), wrong-scope rewrite, security headers, garbage cookie |
| Next Route Handlers (`tests/api/*`) | `/api/auth/login` flow + cookie minting; `/api/proxy/[...path]` bearer-attach, 401 → refresh → retry, refresh failure clears cookie |
| RBAC component gating (`tests/components/*`) | admin and org permission-gated UI elements render / hide as `usePermissions().can()` dictates |

### Coverage thresholds

`vitest.config.ts` enforces:

| Metric | Threshold |
|---|---|
| Lines | 70% |
| Branches | 65% |
| Functions | 70% |
| Statements | 70% |

The `include` list scopes coverage to the surfaces that benefit most from unit tests: `src/lib/**`, `src/hooks/**`, `src/contexts/**`, `src/proxy.ts`. Pages and presentational components are intentionally excluded — they're covered by the E2E suite.

---

## 3. End-to-end suite (Playwright)

### Stack

- **[Playwright 1.59](https://playwright.dev/)** — single browser project (Chromium) by default.
- Runs against a **production build** of the Next app on a dedicated port (`3100`) to avoid colliding with `npm run dev`.
- Specs **seed the `__Host-session` cookie directly** with a JSON session blob (no encryption — the proxy reads JSON), so they exercise the FE proxy + RBAC routing without depending on a backend.

### Layout

```
tests/e2e/
└── auth.spec.ts          # portal isolation + security headers
```

### What's covered today

- Unauthenticated `/dashboard` redirects to `/login` with `?next=...`.
- Unauthenticated `/admin-dashboard` redirects to `/admin-login` with `?next=...`.
- An org user hitting `/admin-dashboard` is shown the not-found page **with the URL preserved** (no path leak).
- An admin hitting `/dashboard` gets the same wrong-scope rewrite.
- A logged-in org user revisiting `/login` is bounced to `/dashboard`.
- A logged-in admin revisiting `/admin-login` is bounced to `/admin-dashboard`.
- The proxy attaches `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, and `Referrer-Policy` on every response.

### Running against a deployed backend

To run the same specs against a real environment:

```bash
PLAYWRIGHT_BASE_URL=https://staging.example.com npm run test:e2e
```

The webServer block is skipped when `PLAYWRIGHT_BASE_URL` is set; Playwright assumes the URL is already serving and runs the specs against it.

> **Note:** Login-form flows (real credentials, 2FA challenge UI, token-refresh-on-401) and **role-aware UI gating** that depends on real `permissions[]` from `GET /auth/me` need a live backend. Those will be added when staging credentials are available — tracked in [known-issues.md](./known-issues.md).

### Why prod build?

`next dev` holds a lock on `.next/dev` that conflicts with a running developer server. Building once (~10 s) and starting via `next start` is parallel-safe and uses the exact bundle we deploy. The trade-off is slower cold-start; for local TDD on E2E, run `npm run test:e2e:ui`.

---

## 4. Test isolation guarantees

The test setup ensures each test starts from a clean slate:

| Resource | Reset scope | Where |
|---|---|---|
| MSW handlers | per-test (`afterEach`) | `tests/setup/vitest.setup.ts` |
| `localStorage` / `sessionStorage` | per-test | same |
| Cookies | per-test | same |
| TanStack Query cache | per-test (new client per render) | `tests/setup/render.tsx` |
| Playwright browser context | per-test by default | Playwright behaviour |

No test should rely on order-dependent state. If you ever need it, prefer `describe.sequential(...)` over global hacks.

---

## 5. CI integration (recommended)

Once a CI environment is available, this set of jobs is the minimum:

```yaml
# Pseudo-code — adapt to your CI tool of choice.
- name: Install
  run: npm ci

- name: Typecheck
  run: npm run typecheck

- name: Lint
  run: npm run lint

- name: Unit tests with coverage
  run: npm run test:coverage

- name: Upload coverage
  if: always()
  run: |
    # upload coverage/lcov.info to Codecov / SonarCloud / similar

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Build for E2E
  run: npm run build

- name: E2E tests
  run: PLAYWRIGHT_USE_MOCK=true npm run test:e2e
  # Or: PLAYWRIGHT_BASE_URL=<staging>, PLAYWRIGHT_USE_MOCK=false
```

The unit suite must stay green to merge. The E2E suite should be required for `main`/`develop` and run on every PR — flaky tests should be quarantined immediately rather than retried into oblivion.

---

## 6. What's intentionally NOT tested

- **shadcn/ui primitives** — vendored, upstream coverage; testing them adds no value.
- **Static layout JSX** — covered by the E2E navigation specs.
- **Recharts internals** — third-party.

---

## 7. Known gaps

Tracked alongside other follow-ups in [known-issues.md](./known-issues.md):

- No tests for `src/lib/auth-service.ts` mutation flows (login, 2FA, password reset). Easy to add once we agree on the MSW fixtures for those endpoints.
- No tests for `src/lib/monitoring-service.ts` — its responses pass through unmapped, so the value-add of a unit test is small; covered better by E2E.
- No tests for individual page components yet. The suite scaffolding (`renderWithProviders`) is ready; pick page-by-page based on incident history.
- E2E suite is single-browser (Chromium). Add `firefox` and `webkit` projects if cross-browser regression becomes a concern.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Unknown Error: Something went wrong` in a service test | MSW didn't intercept the request | Confirm the handler URL exactly matches — including `http://api.test/api` prefix and the path. |
| `localStorage.removeItem is not a function` | happy-dom storage stub not installed | Make sure the test file goes through `tests/setup/vitest.setup.ts`. |
| Playwright fails with `Unable to acquire lock at .next/dev/lock` | Stale `npm run dev` running. | The config now uses `next build && next start -p 3100` to avoid the lock. If you customized it, free port 3100 first. |
| Login E2E fails with timeout filling email | The form input is found by `#email` (id selector), not `getByLabel` — the FieldLabel/Controller pairing isn't a standard label association. |

---

## 9. Future work

- **Visual regression** — happy with the current Playwright coverage; add `toHaveScreenshot` for the dashboard and admin-monitoring pages once the design stabilises.
- **Mutation coverage** — once the staging API is reachable, add E2E for create-score-request, override, batch-upload, invite-user.
- **Accessibility** — `@axe-core/playwright` audit on every page is cheap and worth wiring in.
