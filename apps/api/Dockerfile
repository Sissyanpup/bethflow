FROM node:22-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /workspace

# Development — build context is monorepo root
FROM base AS development
# Copy root workspace manifest
COPY package*.json ./
# Copy all workspace package.json files so npm can resolve the graph
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
# Install all workspace dependencies from root
RUN npm install
# Copy full source
COPY . .
# Generate Prisma client
RUN npm -w apps/api run db:generate
WORKDIR /workspace/apps/api
EXPOSE 4000
CMD ["npm", "run", "dev"]

# Builder
FROM base AS builder
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
RUN npm ci
COPY . .
RUN npm -w packages/shared run build
RUN npm -w apps/api run db:generate
RUN npm -w apps/api run build

# Production
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /workspace
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
RUN npm ci --omit=dev
COPY --from=builder /workspace/apps/api/dist ./apps/api/dist
COPY --from=builder /workspace/node_modules/.prisma ./node_modules/.prisma
COPY apps/api/prisma ./apps/api/prisma
WORKDIR /workspace/apps/api
EXPOSE 4000
CMD ["node", "dist/app.js"]
