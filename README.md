# breeze-agent-kit

Monorepo for Breeze agent experiments and app prototypes.

## Workspace

- Package manager: `bun`
- Task runner: `turbo`
- Apps live in `apps/*`
- Shared packages live in `packages/*`

## Getting started

```bash
bun install
```

## Common commands

From the repository root:

```bash
bun run dev
bun run build
bun run check
bun run test
bun run lint
```

Run a single app from the root:

```bash
bun run dev:mcp
bun run check:mcp
bun run dev:x402
bun run check:x402
```

## Apps

- `apps/x402`: x402 payment wall service (Hono + Solana tooling)
- `apps/mcp`: Breeze MCP stdio server for strategy info, balances, tx creation, and signing/sending on Solana
