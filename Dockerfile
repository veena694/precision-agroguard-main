# Base stage for building the frontend and backend
FROM node:22-slim AS builder

# Install system dependencies for native modules and pnpm
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy lockfile and package.json
COPY pnpm-lock.yaml package.json ./

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the frontend and backend
# This generates dist/spa and dist/server
RUN pnpm run build

# Final production stage
FROM node:22-slim

# Install system dependencies required by ONNX Runtime and Sharp
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm in the final stage too
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
# Copy models directory (it's needed at runtime)
COPY --from=builder /app/models ./models

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port Render uses
EXPOSE 10000

# Start the application
CMD ["node", "dist/server/node-build.mjs"]
