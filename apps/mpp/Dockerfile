FROM oven/bun:1.2 AS base
WORKDIR /app

# Install dependencies — copy all workspace package.json files so bun.lock resolves
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/mcp/package.json apps/mcp/
COPY apps/mpp/package.json apps/mpp/
COPY apps/x402/package.json apps/x402/
COPY apps/website/package.json apps/website/
COPY apps/examples/agent-using-breeze-mcp-server/package.json apps/examples/agent-using-breeze-mcp-server/
COPY apps/examples/agent-using-raw-breeze-functionality/package.json apps/examples/agent-using-raw-breeze-functionality/
COPY apps/examples/agent-using-x402-with-llm/package.json apps/examples/agent-using-x402-with-llm/
COPY apps/examples/agent-using-x402/package.json apps/examples/agent-using-x402/
RUN bun install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules node_modules
COPY package.json bun.lock ./
COPY apps/mpp apps/mpp
COPY tsconfig.json ./
RUN cd apps/mpp && bun build src/index.ts --outdir dist --target bun --sourcemap

# Runtime — single bundled file, only needs node_modules for native/dynamic imports
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/apps/mpp/dist apps/mpp/dist

WORKDIR /app/apps/mpp
EXPOSE 3403
CMD ["bun", "dist/index.js"]
