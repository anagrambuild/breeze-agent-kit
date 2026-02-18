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
bun run dev:website
bun run build:website
```

## Apps

- `apps/mcp`: Breeze MCP stdio server for strategy info, balances, tx creation, and signing/sending on Solana
- `apps/x402`: x402 payment wall service (Hono + Solana tooling)
- `apps/website`: Marketing / docs site (Next.js + Tailwind CSS)

## Examples

Standalone example agents in `apps/examples/`. Each has its own `package.json` and README:

- `apps/examples/agent-using-breeze-mcp-server`: Claude agent that talks to Breeze through the MCP server over stdio
- `apps/examples/agent-using-raw-breeze-functionality`: Claude agent that uses the Breeze SDK directly
- `apps/examples/agent-using-x402`: x402 payment-gated API example that deposits, withdraws, and checks balances with automatic USDC micropayments
- `apps/examples/agent-using-x402-with-llm`: Claude tool-calling agent that interacts with Breeze over the x402 API and signs/sends returned transactions
