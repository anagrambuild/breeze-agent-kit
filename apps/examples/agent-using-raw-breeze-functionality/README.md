# Breeze Agentic Deposit

An AI-powered agent that manages deposits and withdrawals on [Breeze](https://breeze.baby) — a yield aggregator for Solana tokens. You talk to it in plain English; it handles the blockchain transactions for you.

## How It Works

The agent uses **Claude** (Anthropic) as its brain and has four tools it can call:

| Tool               | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `check_balances`   | Shows your positions, yields earned, and APY          |
| `get_deposit_tx`   | Builds an unsigned deposit transaction via Breeze SDK |
| `get_withdraw_tx`  | Builds an unsigned withdrawal transaction             |
| `sign_and_send_tx` | Signs and broadcasts the transaction to Solana        |

When you say something like _"deposit 10 USDC"_, the agent:

1. Calls `get_deposit_tx` to build the transaction
2. Calls `sign_and_send_tx` to sign and send it
3. Returns the confirmed transaction link

## Supported Tokens

USDC, USDT, USDS, SOL, JitoSOL, mSOL, JupSOL, JLP

## Setup

```bash
bun install
cp .env.example .env
```

Fill in `.env`:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
BREEZE_API_KEY=your-breeze-api-key
BREEZE_STRATEGY_ID=your-strategy-id
WALLET_PRIVATE_KEY=your-solana-private-key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Usage

**Interactive mode** — chat back and forth:

```bash
bun start
```

**Single-shot** — one command and done:

```bash
bun start -- "deposit 10 USDC"
```

## Tech Stack

- **TypeScript** / Bun
- **Anthropic SDK** — Claude for reasoning and tool selection
- **Breeze SDK** — transaction building for the yield aggregator
- **Solana Web3.js** — signing and sending transactions
