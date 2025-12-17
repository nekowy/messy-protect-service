# Build stage for Frontend
FROM oven/bun:alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN bun install
COPY frontend/ ./
RUN bun run build

# Final stage
FROM oven/bun:alpine
WORKDIR /app

# Install dependencies for native modules (if needed)
# bun:alpine is based on alpine, so apk is available
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN bun install

# Copy backend source
COPY index.js ./
COPY routes ./routes
COPY services ./services
COPY middleware ./middleware
COPY utils ./utils

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./public

EXPOSE 3000
CMD ["bun", "index.js"]
