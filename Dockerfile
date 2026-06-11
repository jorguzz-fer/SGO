# SGO — Sistema de Gestão Ocupacional
# Imagem para deploy no Coolify (Next.js 16 + Prisma 6 + Postgres).

FROM node:22-alpine AS base
# openssl é exigido pelos engines do Prisma no Alpine
RUN apk add --no-cache openssl
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
# Aplica migrations e sobe o app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
