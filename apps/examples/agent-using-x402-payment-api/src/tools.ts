import type Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { walletPublicKey, signAndSendTransaction, extractTransactionString } from "./solana.js";
import { resolveToken, toBaseUnits, fromBaseUnits, TOKEN_MAP } from "./types.js";
import { checkBalance, deposit, withdraw } from "./x402-client.js";

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "check_balance",
    description:
      "Check the user's current positions and balances on Breeze via the x402 payment API. Returns token balances, deposited amounts, yield earned, and APY for each position.",
    input_schema: {
      type: "object" as const,
      properties: {
        fund_user: {
          type: "string",
          description:
            "The public key of the user to check balances for. Defaults to the agent's wallet.",
        },
      },
      required: [],
    },
  },
  {
    name: "deposit",
    description:
      "Build an unsigned deposit transaction via the x402 payment API. Returns a transaction that must be signed and sent using sign_and_send_tx. The amount is in human-readable units (e.g. 10 for 10 USDC).",
    input_schema: {
      type: "object" as const,
      properties: {
        amount: {
          type: "number",
          description: "Amount to deposit in human-readable units (e.g. 10 for 10 USDC, 0.5 for 0.5 SOL)",
        },
        token_symbol: {
          type: "string",
          description: "Token symbol to deposit (e.g. USDC, SOL, JitoSOL, mSOL, JupSOL, USDT, USDS, JLP)",
        },
      },
      required: ["amount", "token_symbol"],
    },
  },
  {
    name: "withdraw",
    description:
      "Build an unsigned withdrawal transaction via the x402 payment API. Returns a transaction that must be signed and sent using sign_and_send_tx. Set 'all' to true to withdraw the entire position for a token.",
    input_schema: {
      type: "object" as const,
      properties: {
        amount: {
          type: "number",
          description:
            "Amount to withdraw in human-readable units. Not needed if 'all' is true.",
        },
        token_symbol: {
          type: "string",
          description: "Token symbol to withdraw (e.g. USDC, SOL, JitoSOL)",
        },
        all: {
          type: "boolean",
          description: "Set to true to withdraw the entire position for this token.",
        },
      },
      required: ["token_symbol"],
    },
  },
  {
    name: "sign_and_send_tx",
    description:
      "Sign and send a transaction to the Solana blockchain. Use this after getting a transaction from deposit or withdraw. Returns the transaction signature and explorer link.",
    input_schema: {
      type: "object" as const,
      properties: {
        encoded_transaction: {
          type: "string",
          description: "The encoded transaction string returned by deposit or withdraw",
        },
      },
      required: ["encoded_transaction"],
    },
  },
];

interface BalanceEntry {
  token_symbol: string;
  decimals: number;
  total_position_value: number;
  total_deposited_value: number;
  yield_earned: number;
  apy: number;
  fund_id: string;
}

async function handleCheckBalance(fundUser?: string): Promise<string> {
  const user = fundUser || walletPublicKey;
  const responseText = await checkBalance(user);

  // Parse and format with proper decimal conversion
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    return responseText;
  }

  const balances = (
    Array.isArray(parsed) ? parsed
    : parsed && typeof parsed === "object" && "data" in parsed && Array.isArray((parsed as { data: unknown }).data)
      ? (parsed as { data: BalanceEntry[] }).data
      : null
  ) as BalanceEntry[] | null;

  if (!balances || balances.length === 0) {
    return "No positions found on Breeze.";
  }

  const lines = balances.map((b) => {
    const position = fromBaseUnits(b.total_position_value, b.decimals);
    const deposited = fromBaseUnits(b.total_deposited_value, b.decimals);
    const yieldEarned = fromBaseUnits(b.yield_earned, b.decimals);
    const fmt = (v: number) => v === 0 ? "0" : v < 0.01 ? v.toPrecision(4) : v.toFixed(b.decimals <= 6 ? 4 : 6);
    return [
      `Token: ${b.token_symbol}`,
      `  Position Value: ${fmt(position)} ${b.token_symbol}`,
      `  Deposited: ${fmt(deposited)} ${b.token_symbol}`,
      `  Yield Earned: ${fmt(yieldEarned)} ${b.token_symbol}`,
      `  APY: ${b.apy.toFixed(2)}%`,
      `  Fund ID: ${b.fund_id}`,
    ].join("\n");
  });

  return `Breeze Positions for ${user}:\n\n${lines.join("\n\n")}`;
}

async function handleDeposit(
  amount: number,
  tokenSymbol: string
): Promise<string> {
  const token = resolveToken(tokenSymbol);
  const baseUnits = toBaseUnits(amount, token.decimals);

  const responseText = await deposit({
    amount: baseUnits,
    user_key: walletPublicKey,
    strategy_id: config.strategyId,
    base_asset: token.mint,
  });

  const txString = extractTransactionString(responseText);

  return JSON.stringify({
    success: true,
    encoded_transaction: txString,
    message: `Deposit transaction created for ${amount} ${tokenSymbol}. Use sign_and_send_tx to execute it.`,
  });
}

async function handleWithdraw(
  tokenSymbol: string,
  amount?: number,
  all?: boolean
): Promise<string> {
  const token = resolveToken(tokenSymbol);
  const baseUnits = amount && !all ? toBaseUnits(amount, token.decimals) : 0;

  const responseText = await withdraw({
    amount: baseUnits || 0,
    user_key: walletPublicKey,
    strategy_id: config.strategyId,
    base_asset: token.mint,
    all: all || false,
  });

  const txString = extractTransactionString(responseText);

  return JSON.stringify({
    success: true,
    encoded_transaction: txString,
    message: all
      ? `Withdraw ALL transaction created for ${tokenSymbol}. Use sign_and_send_tx to execute it.`
      : `Withdraw transaction created for ${amount} ${tokenSymbol}. Use sign_and_send_tx to execute it.`,
  });
}

async function handleSignAndSend(encodedTransaction: string): Promise<string> {
  const result = await signAndSendTransaction(encodedTransaction);
  return JSON.stringify(result);
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case "check_balance":
        return await handleCheckBalance(input.fund_user as string | undefined);
      case "deposit":
        return await handleDeposit(
          input.amount as number,
          input.token_symbol as string
        );
      case "withdraw":
        return await handleWithdraw(
          input.token_symbol as string,
          input.amount as number | undefined,
          input.all as boolean | undefined
        );
      case "sign_and_send_tx":
        return await handleSignAndSend(input.encoded_transaction as string);
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: message });
  }
}
