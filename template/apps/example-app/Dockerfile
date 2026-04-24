# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies installieren
COPY package*.json ./
RUN npm ci --only=production

# Source kopieren und bauen
COPY . .
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine AS production

# Non-root User
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001 -G nodejs

WORKDIR /app

# Production Dependencies (nur dependencies, nicht devDependencies)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Non-root User
USER nodeapp

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
