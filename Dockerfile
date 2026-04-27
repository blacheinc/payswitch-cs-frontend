# =============================================================================
# Production image — Next.js 16 standalone, served on Azure Container Apps.
#
# Multi-stage build:
#   1. deps      — install dependencies once, cache between rebuilds.
#   2. builder   — full install + `next build`. NO build args needed; every
#                  app secret is server-only and read at runtime.
#   3. runner    — minimal runtime image: Node + the standalone server bundle.
#
# Runtime env vars (set on the platform — Container Apps secret refs / Vercel
# project env / docker run -e):
#   - BACKEND_API_URL   — base URL of the upstream backend, server-only
#
# The image is environment-portable: the same tag promotes from dev → prod
# unchanged. No more rebuild-per-env, no more browser-baked secrets.
# =============================================================================

# --- Stage 1: production dependencies -----------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=optional


# --- Stage 2: build the standalone output -------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build


# --- Stage 3: minimal runner --------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Container Apps sends traffic to PORT (default 3000). Honour the env var if
# the platform overrides it.
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user to run the server.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone build output already includes a minimal node_modules tree.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
