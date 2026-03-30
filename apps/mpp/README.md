# Breeze MPP API

Payment-gated Solana yield strategy endpoints powered by the [Model Payment Protocol (MPP)](https://github.com/solana-foundation/mpp-sdk).

Agents pay **0.001 USDC per API call** via on-chain Solana transactions — no API keys needed on the client side.

## How it works

1. Client sends a request to any paid endpoint
2. Server returns `402 Payment Required` with an MPP challenge
3. Client builds a USDC transfer transaction, signs it, and broadcasts it
4. Client retries the request with the confirmed transaction signature
5. Server verifies the on-chain payment and returns the API response with a payment receipt

## Endpoints

| Method | Path                            | Auth | Description                         |
| ------ | ------------------------------- | ---- | ----------------------------------- |
| GET    | `/`                             | -    | Service info (markdown)             |
| GET    | `/healthz`                      | -    | Health check                        |
| GET    | `/strategy-info/:strategy_id?`  | MPP  | Strategy metadata and APY           |
| GET    | `/breeze-balances/:user_pubkey` | MPP  | Wallet positions, deposits, yield   |
| GET    | `/user-balances/:user_id`       | MPP  | User balance info                   |
| GET    | `/user-yield/:user_id`          | MPP  | Total yield earned                  |
| POST   | `/deposit/tx`                   | MPP  | Build unsigned deposit transaction  |
| POST   | `/deposit/ix`                   | MPP  | Raw deposit instructions            |
| POST   | `/withdraw/tx`                  | MPP  | Build unsigned withdraw transaction |
| POST   | `/withdraw/ix`                  | MPP  | Raw withdraw instructions           |
| POST   | `/close-user-account/tx`        | MPP  | Close account transaction           |
| POST   | `/close-user-account/ix`        | MPP  | Close account instructions          |

When `strategy_id` is omitted, it defaults to `43620ba3-354c-456b-aa3c-5bf7fa46a6d4`.

## Client usage

Install the MPP client SDK:

```bash
npm install @solana/mpp @solana/kit mppx
```

Use `mppx.fetch()` to make requests — it handles the 402 → pay → retry flow automatically:

```ts
import { Mppx, solana } from "@solana/mpp/client";
import { createKeyPairSignerFromBytes, getBase58Codec } from "@solana/kit";

// Create a signer from your wallet's base58-encoded private key
const keyBytes = getBase58Codec().encode(YOUR_BASE58_PRIVATE_KEY);
const signer = await createKeyPairSignerFromBytes(keyBytes);

const mppx = Mppx.create({
	methods: [
		solana.charge({
			signer,
			broadcast: true, // required — client must broadcast the transaction
			rpcUrl: "https://your-rpc-provider.com", // recommended — avoid public RPC rate limits
		}),
	],
});

// All paid endpoints work transparently
const response = await mppx.fetch("https://mpp.breeze.baby/strategy-info");
const data = await response.json();
```

> **Important:** Clients **must** use `broadcast: true` (push mode). In push mode the client
> broadcasts the payment transaction and sends the confirmed signature to the server. The default
> pull mode (where the server broadcasts) currently fails due to blockhash expiry during
> server-side simulation.

### Client requirements

- A Solana wallet with **USDC** (0.001 per call) and a small amount of **SOL** for transaction fees
- A reliable Solana RPC endpoint (Helius, Triton, QuickNode, etc.) — the public RPC is rate-limited

## Server setup

### Environment variables

Create `apps/mpp/.env`:

```env
PORT=3403

# Breeze API — your API key is proxied server-side, never exposed to clients
BREEZE_API_BASE_URL=https://api.breeze.baby
BREEZE_API_KEY=your-breeze-api-key

# MPP payment config
MPP_SECRET_KEY=<run: openssl rand -hex 32>
MPP_PAY_TO=your-solana-wallet-address
MPP_PRICE_USDC=1000

# Solana RPC — required, public RPC is rate-limited
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

| Variable              | Required | Description                                                  |
| --------------------- | -------- | ------------------------------------------------------------ |
| `BREEZE_API_KEY`      | yes      | Breeze API key (server-side only, never exposed)             |
| `MPP_SECRET_KEY`      | yes      | Random hex string for HMAC-signing MPP challenges            |
| `MPP_PAY_TO`          | yes      | Solana wallet address that receives USDC payments            |
| `SOLANA_RPC_URL`      | yes      | Solana RPC endpoint                                          |
| `BREEZE_API_BASE_URL` | no       | Defaults to `https://api.breeze.baby`                        |
| `MPP_PRICE_USDC`      | no       | Price per call in USDC base units (default: `1000` = $0.001) |
| `PORT`                | no       | Server port (default: `3403`)                                |

### Running

```bash
# Development (with hot reload)
bun run dev:mpp

# Build and start
bun run build:mpp
bun run start:mpp
```

### E2E testing

Requires a funded wallet (USDC + SOL) on mainnet:

```env
# Add to apps/mpp/.env
E2E_WALLET_PRIVATE_KEY=your-base58-encoded-private-key
```

```bash
# Terminal 1: start the server
bun run dev:mpp

# Terminal 2: run the e2e test
cd apps/mpp
bun scripts/e2e.ts
```

## Production considerations

- **Replay protection**: Currently uses an in-memory store (`Store.memory()`), which resets on
  restart. For production, implement a persistent store (Redis, database) to prevent transaction
  replay attacks.
- **Rate limiting**: Add rate limiting middleware to prevent abuse, even though calls require payment.
- **TLS**: Deploy behind a reverse proxy (Caddy, nginx) with TLS, or use Cloudflare.
- **CORS**: Add CORS headers if browser-based clients will call the API directly.

## Architecture

```
Client (with @solana/mpp/client)
  │
  │  1. GET /strategy-info
  │  2. ← 402 + MPP challenge
  │  3. Sign & broadcast USDC transfer on Solana
  │  4. Retry with payment signature
  │
  ▼
MPP Server (Hono + @solana/mpp/server)
  │
  │  Verifies on-chain payment
  │  Proxies request with x-api-key header
  │
  ▼
Breeze API (api.breeze.baby)
```
