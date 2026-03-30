import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { PublicKey } from "@solana/web3.js";
import { config } from "./config.js";
import { keypair, connection } from "./solana.js";

const SOLANA_NETWORK = "mainnet-beta";
const USDC_MINT = new PublicKey(config.baseAsset);

const wallet = await createLocalWallet(SOLANA_NETWORK, keypair);
const paymentHandler = createPaymentHandler(wallet, USDC_MINT, connection);
const fetchWithPayment = wrap(fetch, { handlers: [paymentHandler] });

const apiBaseUrl = config.x402ApiUrl.replace(/\/$/, "");

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

async function throwRequestError(prefix: string, response: Response): Promise<never> {
	const bodyText = await response.text();
	throw new Error(normalizeStatusError(`${prefix} (${response.status}): ${bodyText}`));
}

export async function checkBalance(fundUser: string): Promise<string> {
	const url = `${apiBaseUrl}/balance/${encodeURIComponent(fundUser)}`;
	const response = await fetchWithPayment(url, { method: "GET" });
	if (!response.ok) {
		await throwRequestError("Balance request failed", response);
	}
	return response.text();
}

export async function deposit(params: {
	amount: number;
	user_key: string;
	payer_key?: string;
	strategy_id: string;
	base_asset: string;
	user_token_account?: string;
}): Promise<string> {
	const url = `${apiBaseUrl}/deposit`;
	const response = await fetchWithPayment(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(params),
	});
	if (!response.ok) {
		await throwRequestError("Deposit request failed", response);
	}
	return response.text();
}

export async function withdraw(params: {
	amount: number;
	user_key: string;
	payer_key?: string;
	strategy_id: string;
	base_asset: string;
	all?: boolean;
	user_token_account?: string;
	unwrap_wsol_ata?: boolean;
	exclude_fees?: boolean;
}): Promise<string> {
	const url = `${apiBaseUrl}/withdraw`;
	const response = await fetchWithPayment(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(params),
	});
	if (!response.ok) {
		await throwRequestError("Withdraw request failed", response);
	}
	return response.text();
}
