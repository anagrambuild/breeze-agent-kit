import { BreezeSDK } from "@breezebaby/breeze-sdk";
import type Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { walletPublicKey, signAndSendTransaction } from "./solana.js";
import { resolveToken, toBaseUnits, fromBaseUnits, TOKEN_MAP } from "./types.js";

const sdk = new BreezeSDK({
	apiKey: config.breezeApiKey,
});

function normalizeStatusError(raw: string): string {
	const lower = raw.toLowerCase();

	if (
		lower.includes("fundnotlivefordeposit") ||
		(lower.includes("not live") && lower.includes("deposit"))
	) {
		return "Deposit blocked: this fund is not `Live` (likely `Paused` or `WithdrawOnly`). Ask an admin to set status to `Live` or use another fund.";
	}

	if (
		lower.includes("fundnotliveorwithdrawonlyforwithdraw") ||
		(lower.includes("withdraw") && lower.includes("paused"))
	) {
		return "Withdraw blocked: this fund appears `Paused`. Withdraws are allowed only when status is `Live` or `WithdrawOnly`.";
	}

	return raw;
}

// Tool definitions for Claude
export const toolDefinitions: Anthropic.Tool[] = [
	{
		name: "check_balances",
		description:
			"Check the user's current positions and balances on Breeze. Returns token balances, deposited amounts, yield earned, and APY for each position. Optionally filter by a specific token.",
		input_schema: {
			type: "object" as const,
			properties: {
				token_symbol: {
					type: "string",
					description:
						"Optional token symbol to filter by (e.g. USDC, SOL, JitoSOL). If omitted, returns all positions.",
				},
			},
			required: [],
		},
	},
	{
		name: "get_deposit_tx",
		description:
			"Create an unsigned deposit transaction for Breeze. Returns a base64-encoded transaction that must then be signed and sent using sign_and_send_tx. The amount is in human-readable units (e.g. 10 for 10 USDC).",
		input_schema: {
			type: "object" as const,
			properties: {
				amount: {
					type: "number",
					description:
						"Amount to deposit in human-readable units (e.g. 10 for 10 USDC, 0.5 for 0.5 SOL)",
				},
				token_symbol: {
					type: "string",
					description:
						"Token symbol to deposit (e.g. USDC, SOL, JitoSOL, mSOL, JupSOL, USDT, USDS, JLP)",
				},
			},
			required: ["amount", "token_symbol"],
		},
	},
	{
		name: "get_withdraw_tx",
		description:
			"Create an unsigned withdrawal transaction from Breeze. Returns a base64-encoded transaction that must then be signed and sent using sign_and_send_tx. Set 'all' to true to withdraw the entire position for a token.",
		input_schema: {
			type: "object" as const,
			properties: {
				amount: {
					type: "number",
					description: "Amount to withdraw in human-readable units. Not needed if 'all' is true.",
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
			"Sign and send a base64-encoded transaction to the Solana blockchain. Use this after getting a transaction from get_deposit_tx or get_withdraw_tx. Returns the transaction signature and explorer link.",
		input_schema: {
			type: "object" as const,
			properties: {
				encoded_transaction: {
					type: "string",
					description:
						"The base64-encoded transaction string from get_deposit_tx or get_withdraw_tx",
				},
			},
			required: ["encoded_transaction"],
		},
	},
];

// Tool execution
async function checkBalances(tokenSymbol?: string): Promise<string> {
	const balances = await sdk.getBreezeBalances({
		userId: walletPublicKey,
		strategyId: config.strategyId,
		asset: tokenSymbol,
	});

	if (!balances.data || balances.data.length === 0) {
		return tokenSymbol ? `No positions found for ${tokenSymbol}.` : "No positions found on Breeze.";
	}

	const lines = balances.data.map((b) => {
		const position = fromBaseUnits(b.total_position_value, b.decimals);
		const deposited = fromBaseUnits(b.total_deposited_value, b.decimals);
		const yieldEarned = fromBaseUnits(b.yield_earned, b.decimals);
		const fmt = (v: number) =>
			v === 0 ? "0" : v < 0.01 ? v.toPrecision(4) : v.toFixed(b.decimals <= 6 ? 4 : 6);
		return [
			`Token: ${b.token_symbol}`,
			`  Position Value: ${fmt(position)} ${b.token_symbol}`,
			`  Deposited: ${fmt(deposited)} ${b.token_symbol}`,
			`  Yield Earned: ${fmt(yieldEarned)} ${b.token_symbol}`,
			`  APY: ${b.apy.toFixed(2)}%`,
			`  Fund ID: ${b.fund_id}`,
		].join("\n");
	});

	return `Breeze Positions for ${walletPublicKey}:\n\n${lines.join("\n\n")}`;
}

async function getDepositTx(amount: number, tokenSymbol: string): Promise<string> {
	const token = resolveToken(tokenSymbol);
	const baseUnits = toBaseUnits(amount, token.decimals);

	const result = await sdk.createDepositTransaction({
		strategyId: config.strategyId,
		baseAsset: token.mint,
		amount: baseUnits,
		userKey: walletPublicKey,
		payerKey: walletPublicKey,
	});

	if (typeof result !== "string") {
		throw new Error(result.message || "Failed to create deposit transaction");
	}

	return JSON.stringify({
		success: true,
		encoded_transaction: result,
		message: `Deposit transaction created for ${amount} ${tokenSymbol}. Use sign_and_send_tx to execute it.`,
	});
}

async function getWithdrawTx(tokenSymbol: string, amount?: number, all?: boolean): Promise<string> {
	const token = resolveToken(tokenSymbol);

	const options: Parameters<typeof sdk.createWithdrawTransaction>[0] = {
		strategyId: config.strategyId,
		baseAsset: token.mint,
		userKey: walletPublicKey,
		payerKey: walletPublicKey,
		all: all || false,
	};

	if (amount && !all) {
		options.amount = toBaseUnits(amount, token.decimals);
	}

	const result = await sdk.createWithdrawTransaction(options);

	if (typeof result !== "string") {
		throw new Error(result.message || "Failed to create withdraw transaction");
	}

	return JSON.stringify({
		success: true,
		encoded_transaction: result,
		message: all
			? `Withdraw ALL transaction created for ${tokenSymbol}. Use sign_and_send_tx to execute it.`
			: `Withdraw transaction created for ${amount} ${tokenSymbol}. Use sign_and_send_tx to execute it.`,
	});
}

async function signAndSendTx(encodedTransaction: string): Promise<string> {
	const result = await signAndSendTransaction(encodedTransaction);
	return JSON.stringify(result);
}

// Dispatcher
export async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
	try {
		switch (name) {
			case "check_balances":
				return await checkBalances(input.token_symbol as string | undefined);
			case "get_deposit_tx":
				return await getDepositTx(input.amount as number, input.token_symbol as string);
			case "get_withdraw_tx":
				return await getWithdrawTx(
					input.token_symbol as string,
					input.amount as number | undefined,
					input.all as boolean | undefined,
				);
			case "sign_and_send_tx":
				return await signAndSendTx(input.encoded_transaction as string);
			default:
				return JSON.stringify({ error: `Unknown tool: ${name}` });
		}
	} catch (err) {
		const raw = err instanceof Error ? err.message : String(err);
		const message = normalizeStatusError(raw);
		return JSON.stringify({ error: message });
	}
}
