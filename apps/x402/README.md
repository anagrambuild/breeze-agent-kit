# x402

Experimental x402 payment wall service built with Hono.

## Endpoints

- `GET /healthz` - basic health response
- `/deposit/*` - protected by x402 middleware
- `/withdraw/*` - protected by x402 middleware

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
