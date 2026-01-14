# Frontend Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies only
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build argument for API URL
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
