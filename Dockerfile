# STAGE 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Salin file package untuk install dependencies
COPY package*.json ./
RUN npm install

# Salin seluruh kode dan generate Prisma Client
COPY . .
RUN npx prisma generate

# Build aplikasi Next.js
RUN npm run build

# STAGE 2: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Atur environment ke production
ENV NODE_ENV=production

# Salin hanya file yang diperlukan dari stage builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Jalankan migrasi database otomatis lalu nyalakan server
CMD npx prisma migrate deploy && npm start