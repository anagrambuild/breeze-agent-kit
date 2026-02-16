import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VersionedTransaction } from "@solana/web3.js";
import { connection, keypair, sdk, STRATEGY_ID, walletPublicKey } from "../lib/config.js";
import { errorResult, jsonResult, textResult } from "../lib/results.js";
import { fmt, fromBaseUnits, toBaseUnits } from "../lib/amounts.js";
import { resolveToken, tokenSymbolFromMint } from "../lib/tokens.js";

const positiveNumberSchema = z.number().positive();

type StrategyInfo = {
	strategy_name: string;
	strategy_id: string;
	apy: number;
	assets: string[];
	apy_per_asset: Record<string, number>;
};

type BreezeBalance = {
	token_symbol: string;
	total_position_value: number;
	total_deposited_value: number;
	yield_earned: number;
	decimals: number;
	apy: number;
	fund_id: string;
};

export function registerBreezeTools(server: McpServer): void {
	///////////////////////////////
	// Get Strategy Info
	///////////////////////////////
	server.registerTool(
		"get_strategy_info",
		{
			description:
				"Get information about the Breeze yield strategy including name, supported assets, overall APY, and per-asset APY breakdown.",
			inputSchema: {
				strategy_id: z
					.string()
					.optional()
					.describe("Strategy ID to query. Defaults to the configured strategy."),
			},
		},
		async ({ strategy_id }: { strategy_id?: string }) => {
			try {
				const id = strategy_id || STRATEGY_ID;
				const info = (await sdk.getStrategyInfo(id)) as StrategyInfo;

				const assetLines = info.assets.map((mint) => {
					const symbol = tokenSymbolFromMint(mint);
					const assetApy = info.apy_per_asset[mint];
					return `  ${symbol}: ${assetApy?.toFixed(2) ?? "N/A"}%`;
				});

				const text = [
					`Strategy: ${info.strategy_name}`,
					`Strategy ID: ${info.strategy_id}`,
					`Overall APY: ${info.apy.toFixed(2)}%`,
					"",
					"Per-Asset APY:",
					...assetLines,
				].join("\n");

				return textResult(text);
			} catch (err) {
				return errorResult(err);
			}
		},
	);

	///////////////////////////////
	// Check Balances
	///////////////////////////////
	server.registerTool(
		"check_balances",
		{
			description:
				"Check the wallet's current positions and balances on Breeze. Returns token balances, deposited amounts, yield earned, and APY for each position.",
			inputSchema: {
				token_symbol: z
					.string()
					.optional()
					.describe(
						"Optional token symbol to filter by (e.g. USDC, SOL). If omitted, returns all positions.",
					),
			},
		},
		async ({ token_symbol }: { token_symbol?: string }) => {
			try {
				const tokenSymbol = token_symbol ? resolveToken(token_symbol).symbol : undefined;
				const balances = await sdk.getBreezeBalances({
					userId: walletPublicKey,
					strategyId: STRATEGY_ID,
					asset: tokenSymbol,
				});
				const rows = (balances.data || []) as BreezeBalance[];

				if (rows.length === 0) {
					return textResult(
						tokenSymbol
							? `No positions found for ${tokenSymbol}.`
							: "No positions found on Breeze.",
					);
				}

				const lines = rows.map((balance) => {
					const position = fromBaseUnits(balance.total_position_value, balance.decimals);
					const deposited = fromBaseUnits(balance.total_deposited_value, balance.decimals);
					const yieldEarned = fromBaseUnits(balance.yield_earned, balance.decimals);
					return [
						`Token: ${balance.token_symbol}`,
						`  Position Value: ${fmt(position, balance.decimals)} ${balance.token_symbol}`,
						`  Deposited: ${fmt(deposited, balance.decimals)} ${balance.token_symbol}`,
						`  Yield Earned: ${fmt(yieldEarned, balance.decimals)} ${balance.token_symbol}`,
						`  APY: ${balance.apy.toFixed(2)}%`,
						`  Fund ID: ${balance.fund_id}`,
					].join("\n");
				});

				return textResult(`Breeze Positions for ${walletPublicKey}:\n\n${lines.join("\n\n")}`);
			} catch (err) {
				return errorResult(err);
			}
		},
	);

	///////////////////////////////
	// Get Deposit Transaction
	///////////////////////////////
	server.registerTool(
		"get_deposit_tx",
		{
			description:
				"Create an unsigned deposit transaction for Breeze. Returns a base64-encoded transaction that must be signed and sent using sign_and_send_tx. Amount is in human-readable units (e.g. 10 for 10 USDC).",
			inputSchema: {
				amount: z
					.number()
					.positive()
					.describe("Amount to deposit in human-readable units (e.g. 10 for 10 USDC)"),
				token_symbol: z
					.string()
					.describe(
						"Token symbol to deposit (e.g. USDC, SOL, JitoSOL, mSOL, JupSOL, USDT, USDS, JLP)",
					),
			},
		},
		async ({ amount, token_symbol }: { amount: number; token_symbol: string }) => {
			try {
				const depositAmount = positiveNumberSchema.parse(amount);
				const token = resolveToken(token_symbol);
				const baseUnits = toBaseUnits(depositAmount, token.decimals);

				const result = await sdk.createDepositTransaction({
					strategyId: STRATEGY_ID,
					baseAsset: token.mint,
					amount: baseUnits,
					userKey: walletPublicKey,
					payerKey: walletPublicKey,
				});

				if (typeof result !== "string") {
					throw new Error(result.message || "Failed to create deposit transaction");
				}

				return jsonResult({
					success: true,
					encoded_transaction: result,
					message: `Deposit transaction created for ${depositAmount} ${token.symbol}. Use sign_and_send_tx to execute it.`,
				});
			} catch (err) {
				return errorResult(err);
			}
		},
	);

	///////////////////////////////
	// Get Withdraw Transaction
	///////////////////////////////
	server.registerTool(
		"get_withdraw_tx",
		{
			description:
				"Create an unsigned withdrawal transaction from Breeze. Returns a base64-encoded transaction that must be signed and sent using sign_and_send_tx. Set 'all' to true to withdraw the entire position.",
			inputSchema: {
				token_symbol: z.string().describe("Token symbol to withdraw (e.g. USDC, SOL, JitoSOL)"),
				amount: z
					.number()
					.positive()
					.optional()
					.describe("Amount to withdraw in human-readable units. Not needed if 'all' is true."),
				all: z
					.boolean()
					.optional()
					.describe("Set to true to withdraw the entire position for this token."),
			},
		},
		async ({
			token_symbol,
			amount,
			all,
		}: {
			token_symbol: string;
			amount?: number;
			all?: boolean;
		}) => {
			try {
				const token = resolveToken(token_symbol);
				const withdrawAll = all === true;

				if (withdrawAll && amount !== undefined) {
					throw new Error("Do not provide amount when all=true");
				}
				if (!withdrawAll && amount === undefined) {
					throw new Error("Amount is required when all is false");
				}
				const unwrapWsolAta = token.mint === "So11111111111111111111111111111111111111112"
				const options: Parameters<typeof sdk.createWithdrawTransaction>[0] = {
					strategyId: STRATEGY_ID,
					baseAsset: token.mint,
					userKey: walletPublicKey,
					payerKey: walletPublicKey,
					all: withdrawAll,
					excludeFees: true,
					unwrapWsolAta,
				};

				let message: string;
				if (withdrawAll) {
					message = `Withdraw ALL transaction created for ${token.symbol}. Use sign_and_send_tx to execute it.`;
				} else {
					const withdrawAmount = positiveNumberSchema.parse(amount);
					options.amount = toBaseUnits(withdrawAmount, token.decimals);
					message = `Withdraw transaction created for ${withdrawAmount} ${token.symbol}. Use sign_and_send_tx to execute it.`;
				}

				const result = await sdk.createWithdrawTransaction(options);

				if (typeof result !== "string") {
					throw new Error(result.message || "Failed to create withdraw transaction");
				}

				return jsonResult({
					success: true,
					encoded_transaction: result,
					message,
				});
			} catch (err) {
				return errorResult(err);
			}
		},
	);

	///////////////////////////////
	// Sign and Send Transaction
	///////////////////////////////
	server.registerTool(
		"sign_and_send_tx",
		{
			description:
				"Sign and send a base64-encoded transaction to the Solana blockchain. Use this after getting a transaction from get_deposit_tx or get_withdraw_tx.",
			inputSchema: {
				encoded_transaction: z
					.string()
					.describe("The base64-encoded transaction string from get_deposit_tx or get_withdraw_tx"),
			},
		},
		async ({ encoded_transaction }: { encoded_transaction: string }) => {
			try {
				const txBuffer = Buffer.from(encoded_transaction, "base64");
				const transaction = VersionedTransaction.deserialize(txBuffer);

				transaction.sign([keypair]);

				const signature = await connection.sendTransaction(transaction, {
					skipPreflight: false,
					preflightCommitment: "confirmed",
				});

				await connection.confirmTransaction(signature, "confirmed");

				return jsonResult({
					success: true,
					signature,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				});
			} catch (err) {
				return errorResult(err);
			}
		},
	);
}
