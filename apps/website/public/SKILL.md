---
name: breeze
description: Deposit, withdraw, and check balances on Solana DeFi yield strategies via Breeze. Supports x402 keyless HTTP, MCP, and REST API integrations.
compatibility: Requires network access. x402 path requires a funded Solana wallet (USDC + SOL for fees). MCP path requires BREEZE_API_KEY and MCP-compatible runtime. REST path requires BREEZE_API_KEY.
---

# Breeze Agent Kit

Solana yield strategies for AI agents. Earn yield on USDC, SOL, JitoSOL, mSOL, JupSOL, USDT, USDS, and JLP.

## Pick your integration path

| Method | Best for | Auth | Runtime requirement |
|--------|----------|------|---------------------|
| **x402** | Most agents | Wallet pays ~$0.001 USDC/request | Any HTTP client |
| **MCP** | Claude Desktop, Cursor | BREEZE_API_KEY | MCP-compatible runtime only |
| **REST API** | Server-side agents | x-api-key header | Any HTTP client |

**Don't have MCP?** Use x402. It's the most agent-native approach — no API key, no special runtime, just HTTP + a funded Solana wallet.

**Don't want to manage a wallet?** Use the REST API with an API key from [portal.breeze.baby](https://portal.breeze.baby).

---

## Common concepts (all methods)

### Strategy ID

Every Breeze operation targets a yield strategy. The default strategy is:

```
43620ba3-354c-456b-aa3c-5bf7fa46a6d4
```

This is Breeze's primary multi-asset yield strategy supporting all 8 tokens. You can:
- Browse strategies at [try.breeze.baby](https://try.breeze.baby)
- Query strategy metadata: `GET https://api.breeze.baby/strategy-info/43620ba3-354c-456b-aa3c-5bf7fa46a6d4`

### Supported tokens

| Token | Mint address | Decimals |
|-------|-------------|----------|
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | 6 |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | 6 |
| USDS | `USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA` | 6 |
| SOL | `So11111111111111111111111111111111111111112` | 9 |
| JitoSOL | `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn` | 9 |
| mSOL | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So` | 9 |
| JupSOL | `jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v` | 9 |
| JLP | `27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4` | 6 |

### Amount units

- **x402 and REST APIs**: base units (e.g., 1 USDC = `1000000`, 1 SOL = `1000000000`)
- **MCP tools**: human-readable (e.g., 1 USDC = `1`, 1 SOL = `1`)
- Convert: `base_units = floor(human_amount * 10^decimals)`

### Transaction signing

Deposit and withdraw return **unsigned base64-encoded Solana transactions**. Your agent must:

1. Decode the base64 string to bytes
2. Deserialize as a VersionedTransaction (fall back to legacy Transaction)
3. Sign with your Solana keypair
4. Send the raw transaction to the network
5. Confirm with "confirmed" commitment

```typescript
import { VersionedTransaction, Transaction, Connection, Keypair } from "@solana/web3.js";

async function signAndSend(txBase64: string, keypair: Keypair, connection: Connection) {
  const bytes = Buffer.from(txBase64, "base64");
  try {
    const tx = VersionedTransaction.deserialize(bytes);
    tx.sign([keypair]);
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(sig, "confirmed");
    return sig;
  } catch {
    const tx = Transaction.from(bytes);
    tx.partialSign(keypair);
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(sig, "confirmed");
    return sig;
  }
}
```

### API key

Some paths require a `BREEZE_API_KEY`. Get one at **[portal.breeze.baby](https://portal.breeze.baby)**.

---

## Path 1: x402 (recommended)

**Base URL:** `https://x402.breeze.baby`

No API key. Your wallet pays ~$0.001 USDC per request via the x402 payment protocol. Works from any runtime that can make HTTP requests.

### How it works

1. Agent sends a request to x402.breeze.baby
2. Server returns `402` with a payment challenge header
3. Agent pays ~$0.001 USDC on-chain
4. Agent retries with `X-402-Payment` header containing proof
5. Server validates payment and returns the result

Use `@faremeter/fetch` to handle this automatically:

### Setup

```bash
npm install @faremeter/fetch @faremeter/payment-solana @faremeter/wallet-solana @faremeter/info @solana/web3.js bs58 --legacy-peer-deps
```

> `--legacy-peer-deps` is required for npm. pnpm and bun work without it.

```typescript
import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

const keypair = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));
const connection = new Connection(process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com");
const wallet = await createLocalWallet("mainnet-beta", keypair);
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const paymentHandler = createPaymentHandler(wallet, USDC_MINT, connection);
const fetchWithPayment = wrap(fetch, { handlers: [paymentHandler] });
```

### Endpoints

#### GET /healthz (free, no payment)

```bash
curl https://x402.breeze.baby/healthz
# {"status":"ok"}
```

Use this to verify connectivity before making paid requests.

#### POST /deposit

Creates an unsigned deposit transaction.

```typescript
const res = await fetchWithPayment("https://x402.breeze.baby/deposit", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    amount: 1_000_000,        // 1 USDC in base units
    user_key: keypair.publicKey.toBase58(),
    strategy_id: "43620ba3-354c-456b-aa3c-5bf7fa46a6d4",
    base_asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  }),
});
const txBase64 = (await res.text()).trim();
// Sign and send this transaction (see "Transaction signing" above)
```

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | yes | Amount in base units (positive) |
| `user_key` | string | yes | Wallet public key |
| `strategy_id` | string | yes | Breeze strategy ID |
| `base_asset` | string | yes | Token mint address |
| `payer_key` | string | no | Defaults to user_key |

#### POST /withdraw

Creates an unsigned withdrawal transaction.

```typescript
const res = await fetchWithPayment("https://x402.breeze.baby/withdraw", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    amount: 1_000_000,
    user_key: keypair.publicKey.toBase58(),
    strategy_id: "43620ba3-354c-456b-aa3c-5bf7fa46a6d4",
    base_asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    all: false,
    exclude_fees: true,
  }),
});
const txBase64 = (await res.text()).trim();
```

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | yes | Amount in base units |
| `user_key` | string | yes | Wallet public key |
| `strategy_id` | string | yes | Breeze strategy ID |
| `base_asset` | string | yes | Token mint address |
| `payer_key` | string | no | Defaults to user_key |
| `all` | boolean | no | Withdraw entire position |
| `exclude_fees` | boolean | no | Exclude fees from amount (recommended: `true`) |
| `unwrap_wsol_ata` | boolean | no | Unwrap WSOL to native SOL after withdraw |
| `create_wsol_ata` | boolean | no | Create WSOL ATA if it doesn't exist |
| `detect_wsol_ata` | boolean | no | Auto-detect WSOL ATA and set flags accordingly |

**WSOL note:** When withdrawing SOL (`So11111111111111111111111111111111111111112`), pass `unwrap_wsol_ata: true` to receive native SOL instead of wrapped SOL.

#### GET /balance/:fund_user

Returns positions, deposited amounts, yield earned, and APY.

```typescript
const walletKey = keypair.publicKey.toBase58();
const res = await fetchWithPayment(
  `https://x402.breeze.baby/balance/${encodeURIComponent(walletKey)}`,
  { method: "GET" },
);
const balances = await res.json();
```

Values are in base units. Convert to human-readable: `human = base_units / 10^decimals`.

### x402 status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation error — check request body |
| 402 | Payment required — include x402 payment proof |
| 500 | Upstream API error — retry once with backoff |

### x402 environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WALLET_PRIVATE_KEY` | yes | — | Base58-encoded Solana private key |
| `STRATEGY_ID` | no | `43620ba3-354c-456b-aa3c-5bf7fa46a6d4` | Breeze strategy ID |
| `X402_API_URL` | no | `https://x402.breeze.baby` | x402 API base URL |
| `SOLANA_RPC_URL` | no | `https://api.mainnet-beta.solana.com` | Solana RPC endpoint |
| `BASE_ASSET` | no | USDC mint | Default token mint |

---

## Path 2: MCP (Model Context Protocol)

**For MCP-compatible runtimes only** (Claude Desktop, Cursor, etc). If your agent isn't running inside an MCP client, use x402 instead.

### Prerequisites

1. Get your `BREEZE_API_KEY` from **[portal.breeze.baby](https://portal.breeze.baby)**
2. Have a Solana private key (base58-encoded) for `WALLET_PRIVATE_KEY`

### Install

No clone needed — runs directly from npm:

```json
{
  "mcpServers": {
    "breeze": {
      "command": "npx",
      "args": ["-y", "@breezebaby/mcp-server"],
      "env": {
        "BREEZE_API_KEY": "your-api-key-from-portal.breeze.baby",
        "WALLET_PRIVATE_KEY": "your-base58-private-key",
        "BREEZE_STRATEGY_ID": "43620ba3-354c-456b-aa3c-5bf7fa46a6d4",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

Place this config in your MCP client's config file:
- **Claude Desktop (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`
- **Claude Desktop (Linux):** `~/.config/Claude/claude_desktop_config.json`
- **Cursor:** `.cursor/mcp.json` in your project root

Restart the MCP client after adding the config.

### MCP tools

| Tool | Description | Key parameters |
|------|-------------|----------------|
| `get_strategy_info` | Strategy metadata + APY breakdown | `strategy_id` (optional) |
| `check_balances` | Wallet positions, deposits, yield earned | `token_symbol` (optional filter) |
| `get_deposit_tx` | Create unsigned deposit transaction | `amount` (human-readable), `token_symbol` |
| `get_withdraw_tx` | Create unsigned withdraw transaction | `token_symbol`, `amount` or `all: true` |
| `sign_and_send_tx` | Sign and broadcast a transaction | `encoded_transaction` (base64) |

**Note:** MCP tools use human-readable amounts (e.g., `10` for 10 USDC), not base units.

### MCP environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BREEZE_API_KEY` | yes | — | Get from [portal.breeze.baby](https://portal.breeze.baby) |
| `WALLET_PRIVATE_KEY` | yes | — | Base58-encoded Solana private key |
| `BREEZE_STRATEGY_ID` | no | `43620ba3-354c-456b-aa3c-5bf7fa46a6d4` | Breeze strategy ID |
| `SOLANA_RPC_URL` | no | `https://api.mainnet-beta.solana.com` | Solana RPC endpoint |

---

## Path 3: Direct REST API

Traditional HTTP API with API key authentication. For server-side agents or custom integrations that don't want x402 micropayments.

### Prerequisites

Get your `BREEZE_API_KEY` from **[portal.breeze.baby](https://portal.breeze.baby)**.

### Base URL

```
https://api.breeze.baby
```

### Auth

Include your API key in every request:

```
x-api-key: your-breeze-api-key
```

### Endpoints

#### GET /strategy-info/:strategy_id

```bash
curl https://api.breeze.baby/strategy-info/43620ba3-354c-456b-aa3c-5bf7fa46a6d4
```

Returns strategy metadata, supported assets, and APY breakdown. No auth required.

#### POST /deposit/tx

```bash
curl -X POST https://api.breeze.baby/deposit/tx \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "amount": 1000000,
    "user_key": "your-wallet-pubkey",
    "strategy_id": "43620ba3-354c-456b-aa3c-5bf7fa46a6d4",
    "base_asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  }'
```

Returns a base64 unsigned transaction. Sign and send it on Solana.

#### POST /withdraw/tx

```bash
curl -X POST https://api.breeze.baby/withdraw/tx \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "amount": 1000000,
    "user_key": "your-wallet-pubkey",
    "strategy_id": "43620ba3-354c-456b-aa3c-5bf7fa46a6d4",
    "base_asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  }'
```

Returns a base64 unsigned transaction.

---

## Quick-start decision tree

```
Start here:
│
├─ Can your agent make HTTP requests?
│  │
│  ├─ YES, and I have a funded Solana wallet
│  │  → Use x402 (Path 1). No API key needed.
│  │
│  ├─ YES, but I don't want wallet-based auth
│  │  → Use REST API (Path 3). Get API key from portal.breeze.baby.
│  │
│  └─ NO (agent is sandboxed)
│     → Use MCP (Path 2) if your runtime supports it.
│
├─ Is your agent in Claude Desktop or Cursor?
│  → MCP (Path 2) is easiest. Just add the config JSON.
│
└─ Want one-command install for Claude Code?
   → npx clawhub@latest install breeze-x402-payment-api
```

## Security

- Never log, print, or return `WALLET_PRIVATE_KEY` in output.
- Add wallet backup files to `.gitignore`.
- x402 micropayments come from your wallet — only fund it with what you're willing to spend.
- Transaction signing uses your private key — only use keys you control on trusted infrastructure.

## Links

- x402 API: https://x402.breeze.baby
- Get API key: https://portal.breeze.baby
- Strategy browser: https://try.breeze.baby
- GitHub: https://github.com/anagrambuild/breeze-agent-kit
- Examples: https://github.com/anagrambuild/breeze-agent-kit/tree/main/apps/examples
- ClawHub: https://clawhub.ai/keeganthomp/breeze-x402-payment-api
