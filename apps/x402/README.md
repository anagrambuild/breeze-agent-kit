# x402

`x402` is a Hono-based proxy service that wraps dedicated Infra API endpoints and enforces x402 payment requirements before forwarding requests upstream.

## Endpoints

- `GET /healthz` - basic health response
- `/deposit/*` - x402-protected proxy to Infra API agent deposit endpoints
- `/withdraw/*` - x402-protected proxy to Infra API agent withdraw endpoints
- `/balance/*` - x402-protected proxy to Infra API agent balance endpoints

## Development

From this directory:

```bash
bun run dev
```

Or from the repo root:

```bash
bun run --filter x402 dev
```

## Scripts

- `bun run dev` - run with watch mode
- `bun run build` - bundle to `dist`
- `bun run start` - run compiled output
- `bun run check` - TypeScript no-emit check
- `bun run test` - unit tests
- `bun run e2e` - e2e script (`scripts/e2e.ts`)

## Environment

Copy `.env.example` to `.env` and set required values before running protected flows.
