# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Breeze Agent Kit is a **Bun + Turborepo monorepo** for Solana-based yield strategy operations. It exposes Breeze SDK functionality through two apps:

- **`apps/mcp`** — MCP (Model Context Protocol) stdio server exposing yield strategy tools to AI agents (Claude Desktop, Cursor, etc.)
- **`apps/x402`** — Hono HTTP service that gates Breeze endpoints behind x402 payment challenges, then proxies signed requests to a Rust API backend

## Commands

```bash
# Development (all apps)
bun run dev

# Single app
bun run dev:mcp
bun run dev:x402

# Build
bun run build            # all
bun run build:mcp
bun run build:x402

# Type checking
bun run check            # all
bun run check:mcp
bun run check:x402

# Tests (bun native test runner)
bun run test             # all
bun run test:mcp
bun run test:x402

# E2E (x402 only, requires env vars + running server)
bun run e2e:x402

# Lint & format
bun run lint             # oxlint
bun run format           # prettier --write
bun run format:check     # prettier --check
```

## Architecture

### MCP App (`apps/mcp/src/`)

Entry point creates a `McpServer` with stdio transport. All tools registered in `tools/register-breeze-tools.ts`:

| Tool                | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `get_strategy_info` | Fetch strategy metadata and APY breakdown         |
| `check_balances`    | Wallet positions, deposited amounts, yield earned |
| `get_deposit_tx`    | Create unsigned base64 deposit transaction        |
| `get_withdraw_tx`   | Create unsigned base64 withdraw transaction       |
| `sign_and_send_tx`  | Sign and broadcast a base64 transaction           |

Supporting modules:

- `lib/config.ts` — env loading, Breeze SDK + Solana connection init, keypair from base58
- `lib/tokens.ts` — token registry (USDC, SOL, JitoSOL, mSOL, JupSOL, USDT, USDS, JLP) with mint addresses and decimals
- `lib/amounts.ts` — `toBaseUnits()`/`fromBaseUnits()` conversion between human-readable and on-chain amounts
- `lib/results.ts` — MCP response helpers (`textResult`, `jsonResult`, `errorResult`)

### x402 App (`apps/x402/src/`)

Hono app with three payment-gated routes (`/deposit`, `/withdraw`, `/balance`) and a free `/healthz`. Architecture layers:

1. **`middleware/x402.ts`** — Faremeter-based x402 payment wall (requires USDC payment before access)
2. **`middleware/agent-proxy.ts`** — Signs outbound requests with HMAC-SHA256 and proxies to the Rust API
3. **`routes/`** — Endpoint handlers that validate input (Zod) and delegate to the agent proxy
4. **`utils/proxy-signature.ts`** — HMAC-SHA256 request signing logic

### Key Conventions

- **Token amounts**: MCP tools use human-readable units; x402 endpoints use base units (lamports/micro-tokens)
- **Token decimals**: 6 for USDC/USDT/USDS/JLP, 9 for SOL/JitoSOL/mSOL/JupSOL
- **Transaction serialization**: base64 encoding for MCP tool exchange
- **Error handling**: try-catch returning `errorResult(err)` in MCP tools; Hono error responses in x402

## Code Style

- **Formatter**: Prettier — tabs, semicolons, double quotes, trailing commas, 100 char width
- **Linter**: oxlint
- **TypeScript**: strict mode, `noUncheckedIndexedAccess`, no unused locals/params, ES2024 target, Node16 module resolution

## Environment Variables

**MCP** (`apps/mcp/.env`):

- `BREEZE_API_KEY` (required)
- `WALLET_PRIVATE_KEY` (required, base58-encoded)
- `BREEZE_STRATEGY_ID` (optional, has default)
- `SOLANA_RPC_URL` (optional, defaults to mainnet)

**x402** (`apps/x402/.env`):

- `RUST_API_BASE_URL`, `AGENT_PROXY_KEY_ID`, `AGENT_PROXY_SECRET` (required — proxy config)
- `X402_PAY_TO`, `X402_NETWORK` (required — payment config)
- `X402_PRICE_USDC` (optional, default 1000 = $0.001 in microUSDC)
- `PORT` (optional, default 3402)
