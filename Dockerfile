FROM node:22-alpine AS base
# Prisma's schema engine (used by `prisma migrate deploy` at startup) needs OpenSSL.
RUN apk add --no-cache openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
# Needed by the audio worker, seed and admin scripts (run via tsx at runtime)
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/data ./data
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker/start-prod.sh ./docker/start-prod.sh
EXPOSE 3000
CMD ["sh","./docker/start-prod.sh"]
