# syntax=docker/dockerfile:1.7
#
# Dockerfile Next.js 15 — frontend (materialize-mui-nextjs-admin-template).
# Utilise pnpm 9 (lockfile pnpm-lock.yaml — voir frontend/CLAUDE.md).
#
# Cibles :
#   - dev  : pnpm dev (turbopack) avec hot-reload (volume bind)
#   - prod : build standalone (next.config.ts → output: 'standalone' REQUIS)

ARG NODE_VERSION=20
ARG PNPM_VERSION=9.15.4

# ============================================================================
# Stage 1: deps — installation pnpm + dépendances
# ============================================================================
FROM node:${NODE_VERSION}-alpine AS deps
ARG PNPM_VERSION
WORKDIR /app

# pnpm via npm (corepack a un bug d'épinglage : "pnpm@9" se résout en latest=11
# qui exige Node 22). npm install -g respecte la version exacte.
RUN apk add --no-cache libc6-compat \
    && npm install -g pnpm@${PNPM_VERSION}

# IMPORTANT : .npmrc contient `shamefully-hoist=true` et `node-linker=hoisted`,
# nécessaires pour que les dépendances transitives MUI (ex. @mui/utils) soient
# importables. À copier AVANT `pnpm install` sinon les settings sont ignorés.
COPY .npmrc package.json pnpm-lock.yaml ./

# Le `postinstall` du package.json lance `prisma generate && npm run build:icons`,
# d'où la copie de src/prisma et src/assets/iconify-icons avant install.
COPY src/prisma ./src/prisma
COPY src/assets/iconify-icons ./src/assets/iconify-icons

# --no-frozen-lockfile : tolère un pnpm-lock.yaml périmé (sera régénéré).
# À retightener en --frozen-lockfile dès que tu auras fait `pnpm install` sur
# l'hôte et committé le lockfile à jour.
RUN pnpm install --no-frozen-lockfile

# ============================================================================
# Stage 2: dev — hot-reload, code monté via volume
# ============================================================================
FROM node:${NODE_VERSION}-alpine AS dev
ARG PNPM_VERSION
WORKDIR /app

RUN apk add --no-cache libc6-compat \
    && npm install -g pnpm@${PNPM_VERSION}

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["pnpm", "dev"]

# ============================================================================
# Stage 3: builder — build Next.js (output: standalone)
# ============================================================================
FROM node:${NODE_VERSION}-alpine AS builder
ARG PNPM_VERSION
WORKDIR /app

RUN apk add --no-cache libc6-compat \
    && npm install -g pnpm@${PNPM_VERSION}

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables build-time (NEXT_PUBLIC_*).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build

# ============================================================================
# Stage 4: prod — image runtime minimale (~150-200 MB)
# ============================================================================
FROM node:${NODE_VERSION}-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Output standalone : copie minimale (server.js + node_modules figées + assets)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
