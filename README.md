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
| [Security](./docs/security.md) | Token storage posture, threat model, hardening recommendations. |
| [Known issues](./docs/known-issues.md) | Tracked follow-ups (lint debt, set-state-in-effect, etc.). |

A deployment guide will be added separately.

---

## Tech stack

- **Framework**: [Next.js 16](https://nextjs.org/docs) (App Router) on [React 19](https://react.dev/)
- **Language**: TypeScript (strict mode)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- **Server state**: [TanStack Query 5](https://tanstack.com/query/latest)
- **Client state**: React Context (auth, theme)
- **Forms**: [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/)
- **HTTP**: [axios](https://axios-http.com/) (interceptors handle bearer-token attach + 401 refresh)
- **Icons**: [lucide-react](https://lucide.dev/)
- **Toasts**: [sonner](https://sonner.emilkowal.ski/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) (light / dark / system)

---

## Prerequisites

- **Node.js ≥ 20** (required by Next 16 / React 19)
- **npm** (comes with Node)
- A running backend API, or set `NEXT_PUBLIC_MOCK_AUTH=true` to develop the UI standalone.

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
| `npm run lint` | Run ESLint. See [`docs/known-issues.md`](./docs/known-issues.md) for the current backlog. |

---

## Mock auth (UI-only development)

When `NEXT_PUBLIC_MOCK_AUTH=true`, the login screen does **not** call the backend. It seeds a local session so the UI can be exercised standalone.

| Sign-in email contains | Result |
|---|---|
| `admin` | Admin portal session |
| anything else | Org portal session |
| `2fa` | Triggers a simulated 2FA challenge |

Password is ignored. Use any non-empty value.

**Mock auth must be `false` in any deployed environment.**

---

## Environment variables

Three variables are read at build/runtime — see [`.env.example`](./.env.example) for details.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API. |
| `NEXT_PUBLIC_SESSION_SECRET` | AES key used to encrypt the session cookie payload (see [security doc](./docs/security.md)). |
| `NEXT_PUBLIC_MOCK_AUTH` | `true` enables UI-only mock auth. Default: `false`. |

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
│   ├── api-client.ts             # axios instance + interceptors
│   ├── *-service.ts              # One service per backend domain
│   ├── schemas/                  # zod validation schemas
│   └── constant.ts               # Routes, permission codes, API endpoints
├── proxy.ts                      # Next middleware: route classification + RBAC gate
└── types/                        # Shared TypeScript types
```

See [`docs/architecture.md`](./docs/architecture.md) for a deeper tour.

---

## Contributing

1. Create a feature branch from `develop` (`feat/<short-description>` or `fix/<short-description>`).
2. Run `npm run lint` and `npx tsc --noEmit` before opening a PR.
3. PR title follows [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`.
4. Reference the issue or backend integration guide in the PR description.

---

## License

Proprietary — © PaySwitch. All rights reserved.
