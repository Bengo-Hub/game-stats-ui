# -----------------------------
# Base image
# -----------------------------
# Node 22 is required: pnpm 10/11 and Next.js 16 both need Node >= 20.9,
# and corepack-fetched pnpm 11.x needs Node >= 22.13.
FROM node:22-alpine AS base

# -----------------------------
# Dependencies stage
# -----------------------------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Install a stable pnpm 10.x globally. Do NOT use corepack: it fetches
# bleeding-edge pnpm (11.x) that broke the build on Node 20.
RUN npm install -g pnpm@10
# .npmrc wildcard so the build never breaks if it is absent.
COPY package.json pnpm-lock.yaml* .npmrc* ./
# --frozen-lockfile keeps installs reproducible and downgrades
# ERR_PNPM_IGNORED_BUILDS to a warning; native build scripts
# (sharp, unrs-resolver, msw) are allowlisted via onlyBuiltDependencies.
RUN pnpm install --shamefully-hoist --frozen-lockfile

# -----------------------------
# Builder stage
# -----------------------------
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm@10
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js bakes NEXT_PUBLIC_* at BUILD TIME, so these must be passed as
# Docker build args (not runtime env). Defaults point to production DNS so
# a build without --build-arg still produces a working image.
ARG NEXT_PUBLIC_API_URL=https://ultistatsapi.ultichange.org
ARG NEXT_PUBLIC_WS_URL=wss://ultistatsapi.ultichange.org
ARG NEXT_PUBLIC_ANALYTICS_URL=https://analytics.ultichange.org

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_ANALYTICS_URL=$NEXT_PUBLIC_ANALYTICS_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm exec next build --webpack

# -----------------------------
# Production stage (Next.js standalone output)
# -----------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Run the Next.js standalone server directly with node — no package manager
# at runtime (avoids the corepack/pnpm ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING
# crash that caused CrashLoopBackOff in production).
CMD ["node", "server.js"]
