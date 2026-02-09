# STAGE 1: Build
FROM node:22-alpine AS builder
# Menambahkan openssl karena Prisma memerlukannya di Alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
# Menggunakan npm ci agar instalasi lebih konsisten & cepat di CI/Docker
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# STAGE 2: Runner
FROM node:22-alpine AS runner
# Menambahkan openssl juga di runner untuk runtime Prisma
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

# Praktik Keamanan: Jangan jalankan sebagai root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Salin file yang diperlukan
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Berikan izin akses ke user nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Script startup
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]