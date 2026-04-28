# PaySwitch Credit Scoring — Frontend

The web client for the PaySwitch credit-scoring platform: an AI-powered credit-risk assessment system for financial institutions in Ghana. This repository contains the Next.js application that powers both the **organization portal** (used by lenders) and the **admin portal** (used by platform operators).

The backend service is a separate repository.

---

## Documentation

Detailed docs live under [`docs/`](./docs/).

| Doc | Purpose |
|---|---|
| [Architecture](./docs/architecture.md) | Tech stack, folder layout, request lifecycle, system context. |
| [Auth & RBAC](./docs/auth-and-rbac.md) | Login, 2FA, session, token refresh, permission gating. |
| [Data flow](./docs/data-flow.md) | Service layer convention, TanStack Query patterns, snake/camel mapping. |
| [Feature map](./docs/feature-map.md) | Every route → endpoints consumed → permission gates. |
| [Integrations](./docs/integrations.md) | How the FE consumes each backend integration guide. |
| [Security](./docs/security.md) | Token storage, threat model, security headers. |
| [Testing](./docs/testing.md) | Vitest + MSW + Playwright — how to run, write, and extend tests. |
| [Deployment](./docs/deployment-guide.md) | Azure Container Apps + Bicep + GitHub Actions / ADO Pipelines — full one-shot deploy guide. |

For a one-shot Azure deploy, jump straight to [`docs/deployment-guide.md`](./docs/deployment-guide.md).

---

## Tech stack

- **Framework**: [Next.js 16](https://nextjs.org/docs) (App Router) on [React 19](https://react.dev/)
- **Language**: TypeScript (strict mode)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- **Server state**: [TanStack Query 5](https://tanstack.com/query/latest)
- **Client state**: React Context (auth, theme)
- **Forms**: [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/)
- **HTTP**: [axios](https://axios-http.com/) — browser-side, points at same-origin `/api/proxy`. Bearer-attach + 401 refresh run server-side in the proxy Route Handler.
- **Icons**: [lucide-react](https://lucide.dev/)
- **Toasts**: [sonner](https://sonner.emilkowal.ski/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) (light / dark / system)

---

## Prerequisites

- **Node.js ≥ 20** (required by Next 16 / React 19)
- **npm** (comes with Node)
- A running backend API at `BACKEND_API_URL` (see [`.env.example`](./.env.example)).

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL and a fresh session secret:
#   openssl rand -hex 64

# 3. Run the dev server
npm run dev
```

The app is served at [http://localhost:3000](http://localhost:3000).

### Available scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server with hot reload (Turbopack). |
| `npm run build` | Production build to `.next/`. |
| `npm start` | Run the production build (after `npm run build`). |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | TypeScript compile check (`tsc --noEmit`). |
| `npm test` | Run the Vitest unit + integration suite. |
| `npm run test:coverage` | Same, with V8 coverage and the configured thresholds. |
| `npm run test:e2e` | Run the Playwright end-to-end suite (auto-starts a prod build on port 3100). |

---

## Environment variables

See [`.env.example`](./.env.example) for the complete list.

| Variable | Purpose |
|---|---|
| `BACKEND_API_URL` | Base URL of the backend API. **Server-only** — never reaches the browser; the FE talks exclusively to `/api/*` routes on this Next app. |

---

## Project layout

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Login, 2FA, password recovery (unauthenticated)
│   ├── (admin)/                  # Platform-admin portal
│   ├── (org)/                    # Organization portal
│   └── layout.tsx                # Root layout (providers, theme, fonts)
├── components/
│   ├── ui/                       # shadcn/ui primitives (button, dialog, ...)
│   ├── shared/                   # Cross-cutting components (StatCard, EmptyState, ...)
│   └── <feature>/                # Feature-scoped components
├── contexts/                     # AuthContext, ThemeContext
├── hooks/                        # usePermissions, useDebounce, ...
├── lib/                          # Services, API client, query client, utils, schemas
│   ├── api-client.ts             # axios instance pointed at /api/proxy
│   ├── *-service.ts              # One service per backend domain
│   ├── server-session.ts         # HttpOnly cookie helpers (server-only)
│   ├── session-storage.ts        # Non-sensitive user-cache (localStorage)
│   ├── schemas/                  # zod validation schemas
│   └── constant.ts               # Routes, permission codes, API endpoints
├── app/api/                      # Next Route Handlers
│   ├── auth/                     # /auth/* — login, 2FA, logout, refresh, me
│   └── proxy/[...path]/          # Same-origin pass-through to BACKEND_API_URL
├── proxy.ts                      # Next middleware: route classification + RBAC gate
└── types/                        # Shared TypeScript types
```

See [`docs/architecture.md`](./docs/architecture.md) for a deeper tour.

---

## Contributing

1. Create a feature branch from `develop` (`feat/<short-description>` or `fix/<short-description>`).
2. Run `npm run lint` and `npm run typecheck` before opening a PR.
3. PR title follows [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`.
4. Reference any related issue or backend contract in the PR description.

---

## License

Proprietary — © PaySwitch. All rights reserved.
