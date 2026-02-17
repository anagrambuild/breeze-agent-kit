# Stage 1: Install dependencies
FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
COPY apps/mcp/package.json apps/mcp/package.json
COPY apps/website/package.json apps/website/package.json
COPY apps/x402/package.json apps/x402/package.json

RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM deps AS build
WORKDIR /app

COPY apps/x402/src apps/x402/src
COPY apps/x402/tsconfig.json apps/x402/tsconfig.json
COPY tsconfig.json tsconfig.json

RUN cd apps/x402 && bun build src/index.ts --outdir dist --target bun --sourcemap

# Stage 3: Minimal runtime
FROM oven/bun:1.3-slim AS runtime
WORKDIR /app

COPY --from=build --chown=1001:1001 /app/apps/x402/dist/index.js dist/index.js
COPY --from=build --chown=1001:1001 /app/apps/x402/dist/index.js.map dist/index.js.map

USER 1001
EXPOSE 3402

CMD ["bun", "dist/index.js"]
