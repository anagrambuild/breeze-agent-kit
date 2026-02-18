---
name: breeze-x402-payment-api
description: Operates Breeze x402 payment-gated endpoints for balance checks, deposits, and withdrawals on Solana. Use when the user asks to manage Breeze positions or execute paid x402 API calls.
compatibility: Requires Node.js and network access to x402 API and Solana RPC. Requires a funded Solana wallet for x402 USDC micropayments.
---

# Breeze x402 Payment API

Interact with [Breeze](https://breeze.baby) through its x402 payment-gated HTTP API. Each protected request pays a small USDC amount through x402, then returns API data or an unsigned Solana transaction.

## When to use

Use this skill when the user asks for any of:

- "check my Breeze balance" or "show positions/yield"
- "deposit X token into Breeze strategy"
- "withdraw X token from Breeze strategy"
- "sign and send the transaction built by the API"

## Required inputs

- `WALLET_PRIVATE_KEY` (base58 secret key)
- Optional `STRATEGY_ID` (defaults to `43620ba3-354c-456b-aa3c-5bf7fa46a6d4`)
- Optional `X402_API_URL` (default `https://x402.breeze.baby`)
- Optional `SOLANA_RPC_URL` (default `https://api.mainnet-beta.solana.com`)
- Optional `BASE_ASSET` mint (default USDC mint)

## Security rules

- Never print or echo `WALLET_PRIVATE_KEY`.
- Never return raw secret values in tool output.
- If a command fails, redact secrets before showing logs.

## Dependencies and install

Required packages:

- `@faremeter/fetch`
- `@faremeter/payment-solana`
- `@faremeter/wallet-solana`
- `@scure/base`
- `@solana/web3.js`

Install with one package manager:

```bash
npm install @faremeter/fetch @faremeter/payment-solana @faremeter/wallet-solana @scure/base @solana/web3.js
```

```bash
pnpm add @faremeter/fetch @faremeter/payment-solana @faremeter/wallet-solana @scure/base @solana/web3.js
```

```bash
bun add @faremeter/fetch @faremeter/payment-solana @faremeter/wallet-solana @scure/base @solana/web3.js
```

## Setup: Payment-Wrapped Fetch

Use this setup once per runtime. It automatically handles x402 challenges (`402` -> build payment proof -> retry request):

```typescript
import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { base58 } from "@scure/base";

const API_URL = (process.env.X402_API_URL ?? "https://x402.breeze.baby").replace(/\/$/, "");
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const STRATEGY_ID = process.env.STRATEGY_ID || "43620ba3-354c-456b-aa3c-5bf7fa46a6d4";
const BASE_ASSET = process.env.BASE_ASSET ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!;

const keypair = Keypair.fromSecretKey(base58.decode(WALLET_PRIVATE_KEY));
const connection = new Connection(SOLANA_RPC_URL);
const wallet = await createLocalWallet("mainnet-beta", keypair);
const walletPublicKey = keypair.publicKey.toBase58();
const USDC_MINT = new PublicKey(BASE_ASSET);
const paymentHandler = createPaymentHandler(wallet, USDC_MINT, connection);

const fetchWithPayment = wrap(fetch, { handlers: [paymentHandler] });
```

## API endpoint contract

### Check Balance

```
GET /balance/:fund_user
```

Returns JSON with positions, deposited amounts, yield earned, and APY.
Values are in base units. Convert to human amounts with token decimals.

```typescript
const response = await fetchWithPayment(
	`${API_URL}/balance/${encodeURIComponent(walletPublicKey)}`,
	{ method: "GET" },
);
const balances = await response.json();
```

### Deposit

```
POST /deposit
Content-Type: application/json
```

Builds an unsigned deposit transaction.
`amount` must be base units (example: `10_000_000` = 10 USDC).

```typescript
const response = await fetchWithPayment(`${API_URL}/deposit`, {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify({
		amount: 10_000_000, // 10 USDC (6 decimals)
		user_key: walletPublicKey,
		strategy_id: STRATEGY_ID,
		base_asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
	}),
});
const txString = await response.text(); // encoded unsigned transaction
```

### Withdraw

```
POST /withdraw
Content-Type: application/json
```

Builds an unsigned withdrawal transaction. Supports optional WSOL handling flags.
`amount` must be base units.

```typescript
const response = await fetchWithPayment(`${API_URL}/withdraw`, {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify({
		amount: 5_000_000,
		user_key: walletPublicKey,
		strategy_id: STRATEGY_ID,
		base_asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
		all: false,
		exclude_fees: true, // always recommended
		// For wrapped SOL withdrawals only:
		// unwrap_wsol_ata: true,     // unwrap WSOL to native SOL
		// create_wsol_ata: true,     // create WSOL ATA if needed
		// detect_wsol_ata: true,     // auto-detect WSOL ATA existence
	}),
});
const txString = await response.text();
```

Withdraw parameters:

| Parameter         | Type    | Required | Description                                    |
| ----------------- | ------- | -------- | ---------------------------------------------- |
| `amount`          | number  | yes      | Amount in base units                           |
| `user_key`        | string  | yes      | User's Solana public key                       |
| `strategy_id`     | string  | yes      | Breeze strategy ID                             |
| `base_asset`      | string  | yes      | Token mint address                             |
| `all`             | boolean | no       | Withdraw entire position                       |
| `exclude_fees`    | boolean | no       | Exclude fees from amount (recommended: `true`) |
| `unwrap_wsol_ata` | boolean | no       | Unwrap WSOL to native SOL after withdraw       |
| `create_wsol_ata` | boolean | no       | Create WSOL ATA if it doesn't exist            |
| `detect_wsol_ata` | boolean | no       | Auto-detect WSOL ATA and set flags accordingly |

WSOL handling: when withdrawing WSOL (`So11111111111111111111111111111111111111112`), pass `unwrap_wsol_ata: true` to receive native SOL.

## Workflow checklists

Copy a checklist into your working notes and mark each step complete.

### Balance workflow

Task Progress:
- [ ] Read `wallet public key` input
- [ ] Call `GET /balance/:fund_user` with URL-encoded wallet key
- [ ] Verify `response.ok`; if not, capture status/body and stop
- [ ] Parse JSON response
- [ ] Convert base units to human-readable values using token decimals
- [ ] Return balances, yield, and APY clearly

### Deposit workflow

Task Progress:
- [ ] Confirm token mint and decimals
- [ ] Convert user amount to base units (`floor(amount * 10^decimals)`)
- [ ] Call `POST /deposit` with validated payload
- [ ] Verify `response.ok`; if not, capture status/body and stop
- [ ] Extract transaction string from response text
- [ ] Sign and broadcast transaction on Solana
- [ ] Confirm transaction and return explorer link

### Withdraw workflow

Task Progress:
- [ ] Confirm token mint and decimals
- [ ] Convert user amount to base units unless `all=true`
- [ ] Set `exclude_fees: true` unless user asks otherwise
- [ ] For WSOL + native SOL output, set `unwrap_wsol_ata: true`
- [ ] Call `POST /withdraw` with validated payload
- [ ] Verify `response.ok`; if not, capture status/body and stop
- [ ] Extract transaction string from response text
- [ ] Sign and broadcast transaction on Solana
- [ ] Confirm transaction and return explorer link

## Signing and Sending Transactions

Deposit and withdraw return encoded unsigned transactions. Normalize then sign/send:

```typescript
import { VersionedTransaction, Transaction } from "@solana/web3.js";

function extractTransactionString(responseText: string): string {
	const trimmed = responseText.trim();
	try {
		const parsed = JSON.parse(trimmed);
		if (typeof parsed === "string") return parsed;
		throw new Error("expected transaction string");
	} catch (e) {
		if (e instanceof SyntaxError) return trimmed;
		throw e;
	}
}

async function signAndSend(txString: string) {
	const bytes = Uint8Array.from(Buffer.from(txString, "base64"));

	// Try versioned transaction first, then legacy
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

Validation loop:

1. Build/parse transaction string.
2. Try `VersionedTransaction` path.
3. If it fails, try legacy `Transaction` path.
4. Confirm transaction.
5. If both deserializations fail, return a clear decoding error and do not continue.

## Failure handling

- `400` errors: payload issue. Re-check required fields and amount positivity.
- `401/403`: wallet/payment authorization issue. Verify wallet and x402 payment capability.
- `402`: payment challenge not satisfied. Re-run request through wrapped fetch and do not bypass payment handler.
- `500+`: upstream or proxy issue. Retry once with short backoff, then report failure.
- Transaction send failure: return explicit error with stage (`deserialize`, `sign`, `send`, or `confirm`).

## Response format to user

For successful deposit/withdraw, return:

- Action (`deposit` or `withdraw`)
- Token + human amount
- Base-unit amount used in request
- Solana transaction signature
- Explorer URL (`https://solscan.io/tx/{sig}`)

For balance, return:

- Per-token deposited amount
- Yield earned
- APY details when present
- Note that raw API values are base units and were converted

## Supported Tokens

| Token   | Mint                                           | Decimals |
| ------- | ---------------------------------------------- | -------- |
| USDC    | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | 6        |
| USDT    | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | 6        |
| USDS    | `USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA`  | 6        |
| SOL     | `So11111111111111111111111111111111111111112`  | 9        |
| JitoSOL | `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn` | 9        |
| mSOL    | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So`  | 9        |
| JupSOL  | `jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v`  | 9        |
| JLP     | `27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4` | 6        |

## Environment Variables

| Variable             | Required | Default                               | Description                       |
| -------------------- | -------- | ------------------------------------- | --------------------------------- |
| `WALLET_PRIVATE_KEY` | yes      | —                                     | Base58-encoded Solana private key |
| `STRATEGY_ID`        | no       | `43620ba3-354c-456b-aa3c-5bf7fa46a6d4` | Breeze strategy ID               |
| `X402_API_URL`       | no       | `https://x402.breeze.baby`            | x402 payment API URL              |
| `SOLANA_RPC_URL`     | no       | `https://api.mainnet-beta.solana.com` | Solana RPC endpoint               |
| `BASE_ASSET`         | no       | USDC mint                             | Default token mint for operations |

## Additional reference

See `apps/examples/agent-using-x402-payment-api/` for a full implementation.
