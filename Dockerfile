# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and pnpm config
COPY package.json pnpm-lock.yaml* .npmrc ./

# Install dependencies (honour .npmrc settings like shamefully-hoist)
# Try frozen lockfile first for deterministic builds; if that fails (missing
# hoisted packages), fall back to a non-frozen install to allow resolution.
RUN pnpm install --frozen-lockfile --shamefully-hoist || pnpm install --shamefully-hoist

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm
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

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Install pnpm so `pnpm start` is available in the final image
RUN npm install -g pnpm

# Fallback-friendly copy: prefer standalone output, otherwise copy full .next and node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ || true
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static || true

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start using the standard Next.js start script. If the standalone server.js exists this will
# still work because Next will prefer the built standalone files; otherwise `next start` will
# serve from the copied .next directory.
CMD ["pnpm", "start"]
