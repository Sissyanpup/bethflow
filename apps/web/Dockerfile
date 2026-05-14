FROM node:22-alpine AS base
WORKDIR /workspace

# Development — build context is monorepo root
FROM base AS development
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/
RUN npm install
COPY . .
WORKDIR /workspace/apps/web
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Builder
FROM base AS builder
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/
RUN npm ci
COPY . .
RUN npm -w packages/shared run build
RUN npm -w apps/web run build

# Production (nginx)
FROM nginx:alpine AS production
COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
