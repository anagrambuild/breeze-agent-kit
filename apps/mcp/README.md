# mcp

MCP server (stdio) for Breeze strategy operations on Solana.

This service exposes Breeze tools to MCP clients (for example Cursor) and handles:

- Strategy info and APY lookup
- Balance/position checks for the configured wallet
- Unsigned deposit/withdraw transaction creation
- Local signing + broadcast for returned transactions

## Environment

Create `apps/mcp/.env` with:

```bash
BREEZE_API_KEY=...
WALLET_PRIVATE_KEY=... # base58-encoded secret key
# Optional:
BREEZE_STRATEGY_ID=43620ba3-354c-456b-aa3c-5bf7fa46a6d4
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

Required:

- `BREEZE_API_KEY`
- `WALLET_PRIVATE_KEY`

Optional:

- `BREEZE_STRATEGY_ID` (defaults to the strategy above)
- `SOLANA_RPC_URL` (defaults to Solana mainnet public RPC)

## Tools

- `get_strategy_info` - returns strategy metadata and APY breakdown
- `check_balances` - returns current Breeze positions for the configured wallet
- `get_deposit_tx` - creates an unsigned base64 deposit transaction
- `get_withdraw_tx` - creates an unsigned base64 withdraw transaction
- `sign_and_send_tx` - signs and sends a base64 transaction

## Project Structure

- `src/index.ts` - MCP server bootstrap and transport wiring
- `src/tools/register-breeze-tools.ts` - Breeze MCP tool registration/handlers
- `src/lib/config.ts` - env/config loading and SDK/connection setup
- `src/lib/tokens.ts` - token metadata and symbol/mint resolution
- `src/lib/amounts.ts` - amount conversion and formatting helpers
- `src/lib/results.ts` - common MCP text/json/error response helpers

## Development

From this directory:

```bash
bun run dev
```

Or from the repo root:

```bash
bun run --filter mcp dev
```

## Scripts

- `bun run dev` - run with Bun watch mode
- `bun run build` - compile TypeScript to `dist`
- `bun run start` - run compiled MCP stdio server
- `bun run check` - TypeScript no-emit check
- `bun run test` - Node test runner

## Test With Claude Desktop (Local)

1. Create env file:

```bash
cp .env.example .env
```

2. Fill required values in `apps/mcp/.env`:

- `BREEZE_API_KEY`
- `WALLET_PRIVATE_KEY`

3. Build once:

```bash
bun run build
```

4. Get your Node binary path:

```bash
which node
```

Use that exact absolute path in Claude config.

5. Add this MCP server to Claude Desktop config (macOS):
   `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
"breeze": {
      "command": "node",
      "args": [
        "path-to-the-folder/breeze-mcp-server/build/index.js"
      ],
      "env": {
        "BREEZE_API_KEY": "your-breeze-api-key",
        "BREEZE_STRATEGY_ID": "strategy-id",
        "WALLET_PRIVATE_KEY": "your-private-key",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
}
```

6. Restart Claude Desktop.

7. In Claude, run a quick smoke test prompt, for example:

- "Use `get_strategy_info`."
- "Use `check_balances` for my configured wallet."

If tools do not appear:

- Confirm `command` matches `which node`.
- Confirm `DOTENV_CONFIG_PATH` points to your real `.env` file.
- Confirm `bun run build` was run and `dist/index.js` exists.
- Avoid `dev` for Claude MCP.
