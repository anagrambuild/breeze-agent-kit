# Breeze x402 Example

End-to-end example that deposits, withdraws, and checks balances on [Breeze](https://breeze.baby) through the **x402 payment-gated API**. No Breeze API key needed — each request pays ~$0.01 USDC automatically via the [x402 protocol](https://www.faremeter.com).

## How It Works

The script runs three x402 API calls in sequence:

1. **Deposit** — `POST /deposit` with automatic USDC micropayment, returns an unsigned transaction
2. **Withdraw** — `POST /withdraw` with automatic USDC micropayment, returns an unsigned transaction
3. **Balance** — `GET /balance/:fund_user` with automatic USDC micropayment, returns positions

For deposit and withdraw, the script optionally signs and sends the returned transaction to Solana.

Each call:

1. Sends a preflight request (expects `402 Payment Required`)
2. Uses `@faremeter/fetch` to automatically pay the USDC fee and retry
3. Validates the response and optionally submits the transaction on-chain

## Setup

```bash
bun install
cp .env.example .env
```

Fill in `.env`:

```
SOLANA_PRIVATE_KEY=your-base58-solana-private-key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
API_URL=https://x402.breeze.baby
STRATEGY_ID=43620ba3-354c-456b-aa3c-5bf7fa46a6d4
BASE_ASSET=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
DEPOSIT_AMOUNT=10000
WITHDRAW_AMOUNT=1000
SIGN_AND_SEND_TX=true
```

Your wallet needs a small USDC balance for x402 payments (~$0.01 per API call).

## Usage

```bash
bun start
```

## Environment Variables

| Variable             | Default                               | Description                                    |
| -------------------- | ------------------------------------- | ---------------------------------------------- |
| `SOLANA_PRIVATE_KEY` | (required)                            | Base58-encoded Solana private key              |
| `SOLANA_RPC_URL`     | `https://api.mainnet-beta.solana.com` | Solana RPC endpoint                            |
| `API_URL`            | `https://x402.breeze.baby`            | x402 API base URL                              |
| `STRATEGY_ID`        | `43620ba3-354c-456b-aa3c-5bf7fa46a6d4` | Breeze strategy ID — any valid strategy ID works |
| `BASE_ASSET`         | USDC mint                             | Token mint address                             |
| `DEPOSIT_AMOUNT`     | `10000`                               | Deposit amount in base units                   |
| `WITHDRAW_AMOUNT`    | `1000`                                | Withdraw amount in base units                  |
| `SIGN_AND_SEND_TX`   | `true`                                | Whether to sign and send returned transactions |
| `WITHDRAW_ALL`       | `false`                               | Withdraw entire position                       |

## Tech Stack

- **TypeScript** / Bun
- **Faremeter** — x402 payment handling (automatic USDC micropayments)
- **Solana Web3.js** — signing and sending transactions
