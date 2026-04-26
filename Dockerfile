# =============================================================================
# Production image — Next.js 16 standalone, served on Azure Container Apps.
#
# Multi-stage build:
#   1. deps      — install production dependencies once, cache between rebuilds.
#   2. builder   — full install + `next build` with the env vars baked in.
#   3. runner    — minimal runtime image: Node + the standalone server bundle.
#
# IMPORTANT: every NEXT_PUBLIC_* variable is INLINED INTO THE CLIENT BUNDLE
# at `next build` time. To rotate any of these (e.g. NEXT_PUBLIC_SESSION_SECRET)
# you must rebuild the image and redeploy. See docs/deployment-guide.md §6.
# =============================================================================

# --- Stage 1: production dependencies -----------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only the lock + manifest so this layer caches across code-only changes.
COPY package.json package-lock.json* ./
RUN npm ci --omit=optional


# --- Stage 2: build the standalone output -------------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables must be present at build time.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SESSION_SECRET
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SESSION_SECRET=${NEXT_PUBLIC_SESSION_SECRET}

# Build-time telemetry off, build runs deterministically.
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
