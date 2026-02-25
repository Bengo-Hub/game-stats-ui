# -----------------------------
# Base image
# -----------------------------
FROM node:20-alpine AS base
WORKDIR /app

# Enable pnpm via corepack (DO NOT install globally)
RUN corepack enable

# -----------------------------
# Dependencies stage
# -----------------------------
FROM base AS deps

RUN apk add --no-cache libc6-compat

# Copy package files and pnpm config
COPY package.json pnpm-lock.yaml* .npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile --shamefully-hoist || pnpm install --shamefully-hoist


# -----------------------------
# Builder stage
# -----------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time args for Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_ANALYTICS_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_ANALYTICS_URL=${NEXT_PUBLIC_ANALYTICS_URL}

RUN pnpm build


# -----------------------------
# Production stage
# -----------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Enable pnpm in runtime image
RUN corepack enable

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next standalone output (recommended)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# If standalone is not enabled, fallback:
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["pnpm", "start"]