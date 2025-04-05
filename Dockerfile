# syntax=docker.io/docker/dockerfile:1
# from: https://github.com/vercel/next.js/blob/12c483aa4d9d91a0f2c9a091df4fb750a963b6a5/examples/with-docker/Dockerfile

FROM node:18-alpine AS base

# install dependencies only when needed
FROM base AS deps
WORKDIR /app

# install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# build Next server (standalone mode)
RUN corepack enable pnpm && pnpm run build

# production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# server.js is in /app/dist/src
# copy (builder) /app/dist/src into (runner) /app/src
COPY --from=builder --chown=expressjs:nodejs /app/dist ./
COPY --from=builder --chown=expressjs:nodejs /app/public ./public
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules

USER expressjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "src/server.js"]