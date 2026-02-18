# Breeze x402 Payment Agent

An AI-powered agent that manages deposits and withdrawals on [Breeze](https://breeze.baby) through the **x402 payment-gated HTTP API**. Each API call is paid for with a USDC micropayment on Solana, handled automatically by the [x402 protocol](https://www.x402.org/).

## How It Works

The agent uses **Claude** (Anthropic) as its brain and has four tools it can call:

| Tool | x402 Endpoint | What it does |
|------|--------------|-------------|
| `check_balance` | `GET /balance/:fund_user` | Shows your positions, yields earned, and APY |
| `deposit` | `POST /deposit` | Builds an unsigned deposit transaction |
| `withdraw` | `POST /withdraw` | Builds an unsigned withdrawal transaction |
| `sign_and_send_tx` | n/a (local) | Signs and broadcasts the transaction to Solana |

When you say something like *"deposit 10 USDC"*, the agent:
1. Calls `deposit` (pays a USDC micropayment to the x402 API)
2. Calls `sign_and_send_tx` to sign and send the returned transaction
3. Returns the confirmed transaction link

## Supported Tokens

USDC, USDT, USDS, SOL, JitoSOL, mSOL, JupSOL, JLP

## Prerequisites

Uses the hosted x402 server at `https://x402.breeze.baby` by default. To run locally instead, set `X402_API_URL=http://127.0.0.1:3402` and start the local server (`cd apps/x402 && bun run dev`).

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
WALLET_PRIVATE_KEY=your-base58-solana-private-key
STRATEGY_ID=43620ba3-354c-456b-aa3c-5bf7fa46a6d4  # default — or any Breeze strategy ID
X402_API_URL=https://x402.breeze.baby
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Usage

**Interactive mode** — chat back and forth:
```bash
npm start
```

**Single-shot** — one command and done:
```bash
npm start -- "check my balances"
```

## Tech Stack

- **TypeScript** / Node.js
- **Anthropic SDK** — Claude for reasoning and tool selection
- **@faremeter/fetch** — automatic x402 payment handling
- **Solana Web3.js** — signing and sending transactions
