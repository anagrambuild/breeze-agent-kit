const SOLANA_NETWORK = "mainnet-beta";
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const USDC_MAINNET_MINT =
	process.env.USDC_MAINNET_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const API_URL = process.env.API_URL || "https://x402.breeze.baby";

function firstDefined(...values: Array<string | undefined>): string | undefined {
	for (const value of values) {
		if (value && value.trim()) return value.trim();
	}
	return undefined;
}

function normalizeBaseUrl(url: string): string {
	return url.endsWith("/") ? url.slice(0, -1) : url;
}

const apiBaseUrl = normalizeBaseUrl(API_URL);

const _svmPrivateKey = firstDefined(process.env.SOLANA_PRIVATE_KEY, process.env.SVM_PRIVATE_KEY);
if (!_svmPrivateKey) {
	throw new Error("Missing wallet key. Set SOLANA_PRIVATE_KEY (preferred) or SVM_PRIVATE_KEY.");
}
const svmPrivateKey: string = _svmPrivateKey;

const AGENT_USER_KEY_ENV = firstDefined(process.env.AGENT_USER_KEY, process.env.USER_KEY);
const AGENT_PAYER_KEY = firstDefined(process.env.AGENT_PAYER_KEY, process.env.PAYER_KEY);
const STRATEGY_ID = process.env.STRATEGY_ID ?? "";
const BASE_ASSET = process.env.BASE_ASSET ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const BALANCE_FUND_USER_ENV = firstDefined(
	process.env.BALANCE_FUND_USER,
	process.env.FUND_USER,
	process.env.AGENT_FUND_USER,
);

const DEPOSIT_AMOUNT = Number(process.env.DEPOSIT_AMOUNT ?? "10000");
const WITHDRAW_AMOUNT = Number(process.env.WITHDRAW_AMOUNT ?? "1000");
const WITHDRAW_ALL = String(process.env.WITHDRAW_ALL ?? "false") === "true";
const SIGN_AND_SEND_TX = String(process.env.SIGN_AND_SEND_TX ?? "true") === "true";

export {
	SOLANA_NETWORK,
	SOLANA_RPC_URL,
	USDC_MAINNET_MINT,
	apiBaseUrl,
	svmPrivateKey,
	AGENT_USER_KEY_ENV,
	AGENT_PAYER_KEY,
	STRATEGY_ID,
	BASE_ASSET,
	BALANCE_FUND_USER_ENV,
	DEPOSIT_AMOUNT,
	WITHDRAW_AMOUNT,
	WITHDRAW_ALL,
	SIGN_AND_SEND_TX,
	firstDefined,
};
