# Breeze Agentic Deposit

An AI-powered agent that manages deposits and withdrawals on [Breeze](https://breeze.baby) — a yield aggregator for Solana tokens. You talk to it in plain English; it handles the blockchain transactions for you.

## How It Works

The agent uses **Claude** (Anthropic) as its brain and connects to the **Breeze MCP server** over stdio for all DeFi operations. Claude discovers the available tools from the MCP server at startup and calls them as needed.

**MCP server tools available to the agent:**

| Tool                | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `get_strategy_info` | Shows strategy name, supported assets, and APY breakdown |
| `check_balances`    | Shows your positions, yields earned, and APY             |
| `get_deposit_tx`    | Builds an unsigned deposit transaction                   |
| `get_withdraw_tx`   | Builds an unsigned withdrawal transaction                |
| `sign_and_send_tx`  | Signs and broadcasts the transaction to Solana           |

When you say something like _"deposit 10 USDC"_, the agent:

1. Calls `get_deposit_tx` to build the transaction
2. Calls `sign_and_send_tx` to sign and send it
3. Returns the confirmed transaction link

## Supported Tokens

USDC, USDT, USDS, SOL, JitoSOL, mSOL, JupSOL, JLP

## Setup

**1. Build the MCP server** (sibling directory):

```bash
cd ../breeze-mcp-server
bun install && bun run build
```

**2. Install the agent**:

```bash
cd ../breeze-agentic-deposit
bun install
cp .env.example .env
```

**3. Configure** `.env`:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
MCP_SERVER_PATH=../breeze-mcp-server

# Passed through to the MCP server
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

## Architecture

```
User  <-->  Agent (Claude + Anthropic SDK)  <--stdio-->  Breeze MCP Server
                                                           |
                                                     Breeze SDK + Solana
```

The agent is a thin AI layer — all blockchain logic lives in the MCP server.

## Tech Stack

- **TypeScript** / Bun
- **Anthropic SDK** — Claude for reasoning and tool selection
- **MCP SDK** — stdio client connecting to the Breeze MCP server
