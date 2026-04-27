# Known issues & follow-ups

A living list of debt and follow-ups that didn't block shipping the deliverable but should be addressed before — or shortly after — going live with real customer data. Each item has a severity, a description, and a pointer to the relevant code.

Severity legend:

- 🔴 **Blocker for production** — must be fixed before exposing the app to real users / data.
- 🟡 **Important** — should be addressed in the first post-launch iteration.
- 🟢 **Nice to have** — quality / DX improvement, not safety-critical.

---

## Security

### 🟡 Nonce-based Content Security Policy

**Where:** [`next.config.ts`](../next.config.ts), [`src/proxy.ts`](../src/proxy.ts)

The current CSP is `frame-ancestors 'none'` only — anti-clickjacking but no script restrictions. Adding `'unsafe-inline'` / `'unsafe-eval'` to make Next 16 work as-is would defeat the purpose. Pattern to adopt: per-request nonce in the proxy → injected into Next's script tags → `script-src 'self' 'nonce-XXX'`.

---

## Code quality

### 🟡 21 × `@typescript-eslint/no-explicit-any`

**Where:**

- `src/app/(admin)/admin-monitoring/page.tsx` — 7 occurrences. The biggest single file in the codebase (~1500 lines). The `any` types are mostly chart-data shapes and event handlers.
- `src/app/(org)/score-requests/[id]/page.tsx` — 10 occurrences in conditional rendering of bureau / decision payloads.
- `src/app/(org)/score-requests/new/page.tsx` — 4 in form-submission helpers.
- `src/components/training/{add-data-source,upload-dataset}-modal.tsx` — 2 in upload progress callbacks.
- `src/lib/training-service.ts:46`, `src/types/training-type.ts:42` — training-data row shape.

These are pre-existing weak typings. None affect runtime correctness but they reduce the value of TS as a refactoring tool. Plan: tighten by domain; the training-service ones are worth doing first because they affect data flowing into multiple consumers.

### 🟡 9 × `react-hooks/set-state-in-effect`

**Where:**

- [`src/contexts/auth-context.tsx:139`](../src/contexts/auth-context.tsx) — `useEffect(() => initializeAuth(), …)`
- [`src/contexts/theme-context.tsx`](../src/contexts/theme-context.tsx) — `setThemeState(stored)` and `setResolvedTheme(resolved)` inside effects
- [`src/app/(admin)/admin-settings/page.tsx:38`](../src/app/(admin)/admin-settings/page.tsx) — sync `totp_enabled` from query
- [`src/components/settings/personal-account-tab.tsx:37`](../src/components/settings/personal-account-tab.tsx) — same pattern
- Edit/invite modals — `form.reset()` then `setSelectedRole(null)` inside `useEffect(..., [open])` after a `if (open)` guard.

The new React 19 lint flags effects whose body imperatively calls `setState`. Fixing each requires a targeted refactor:

- The modal patterns can usually become "derived state" — compute from props at render time and use `key={open}` to remount instead of clearing.
- The query→state sync (admin-settings, personal-account-tab) should switch to the canonical pattern of reading the query value directly in render rather than copying it into local state.
- Auth/theme contexts need careful attention because their effects do real side-effects (localStorage reads, document mutations) — the right answer is `useSyncExternalStore`, not derived state.

None of these cause user-visible bugs today; they cause cascading renders that slightly hurt performance.

### 🟡 4 × `react-hooks/exhaustive-deps` warnings

**Where:**

- `src/contexts/auth-context.tsx:135,163` — missing `getOrganization` dependency.
- `src/contexts/theme-context.tsx:62` — missing `resolveTheme` dependency.
- `src/components/shared/role-picker.tsx:63` — `roles` should be wrapped in `useMemo`.

Adding the missing deps blindly may cause re-render storms; each one needs a targeted fix that either memoizes the dep or proves the omission is correct via an inline disable.

### 🟢 `no-img-element` — login shell

**Where:** [`src/components/auth/login-shell.tsx:462`](../src/components/auth/login-shell.tsx)

A raw `<img>` tag for the brand logo. Switch to `next/image` for LCP improvement on the login page.

### 🟢 Dual query-key conventions

**Where:** [`src/lib/query-client.tsx`](../src/lib/query-client.tsx)

The legacy `queryKeys` factory is kept for backward compatibility but every new feature uses per-service `*_KEYS` factories (see [data-flow.md](./data-flow.md)). The legacy export should be removed once the last caller is migrated. Likely candidates: search for `queryKeys.` in `src/`.

---

## Testing

The Vitest unit/integration suite (100 tests across services, hooks, contexts, schemas, and the proxy middleware) and the Playwright E2E suite (8 specs covering login, portal isolation, and security headers) are now in place. See [testing.md](./testing.md) for how to run and extend them.

### 🟡 Mutation coverage missing

These flows need real-backend E2E once staging credentials exist:

- Login + 2FA + token refresh.
- Score-request override / outcome / performance reporting.
- Batch upload submission + cancel.
- Invite/edit/suspend org users + admins.

### 🟢 Service-level mutation tests

`auth-service.ts`, `developer-service.ts`, `organization-service.ts`, `training-service.ts`, `admin-management-service.ts`, `user-management-service.ts`, `rbac-service.ts` have no unit tests yet. Each is a thin pass-through; coverage cost is low. Pick the ones touched most often by ongoing work first.

---

## UX & content

### 🟡 Placeholder pages

- `/reports` — UI scaffolding only; backend endpoints not wired.
- `/scoring-engine` — partial; the model-routing UI hasn't landed.

These are visible to users and should either be wired up or hidden via a feature flag for the launch.

### 🟢 Toast deduplication

A handful of mutation flows fire two `toast.success()` calls (one from the modal, one from the parent invalidation handler). Audit `toast.success` call sites and centralize them on the mutation `onSuccess`.

### 🟢 Empty-state copy

Some empty states still read like dev placeholders ("No data yet"). Pass over them once with finalized copy before launch.

---

## Build & DX

### 🟢 Split `admin-monitoring/page.tsx`

~1500 lines, 7 `any` types, hard to navigate. Extract one component per tab (`InfrastructureTab`, `RiskTab`, …) and a shared chart palette.

### 🟢 Add `npm run typecheck`

Today contributors run `npx tsc --noEmit`. Add it as a script alias for muscle memory.

```json
"scripts": {
  "typecheck": "tsc --noEmit"
}
```

### 🟢 Husky + lint-staged

No pre-commit hook is configured. Adding `husky` + `lint-staged` to run `eslint --fix` and `tsc --noEmit` on staged files would catch the regressions that produced the unused-import backlog.

---

## When closing an item

When you close an item, also remove the entry here so this doc reflects the current state. If a fix uncovers a new follow-up, add the new entry rather than letting the old one drift.
