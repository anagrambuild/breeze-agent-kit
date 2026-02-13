#!/usr/bin/env bun
/// <reference lib="dom" />

import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { base58 } from "@scure/base";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const SOLANA_NETWORK = "mainnet-beta";
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const USDC_MAINNET_MINT =
	process.env.USDC_MAINNET_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const API_URL = process.env.API_URL || "http://127.0.0.1:3402";

enum x402Endpoint {
	Deposit = "/deposit",
	Withdraw = "/withdraw",
	Balance = "/balance",
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
	for (const value of values) {
		if (value && value.trim()) return value.trim();
	}
	return undefined;
}

function normalizeBaseUrl(url: string): string {
	return url.endsWith("/") ? url.slice(0, -1) : url;
}

type PaymentResponseHeader = {
	x402Version?: number;
	success?: boolean;
	transaction?: string;
	network?: string;
};

type AgentTxPayload = {
	amount: number;
	user_key: string;
	payer_key?: string;
	strategy_id: string;
	base_asset: string;
	all?: boolean;
};

const apiBaseUrl = normalizeBaseUrl(API_URL);

const svmPrivateKey = firstDefined(process.env.SOLANA_PRIVATE_KEY, process.env.SVM_PRIVATE_KEY);
if (!svmPrivateKey) {
	throw new Error("Missing wallet key. Set SOLANA_PRIVATE_KEY (preferred) or SVM_PRIVATE_KEY.");
}

const keypair = Keypair.fromSecretKey(base58.decode(svmPrivateKey));
const wallet = await createLocalWallet(SOLANA_NETWORK, keypair);
const connection = new Connection(SOLANA_RPC_URL);

const paymentHandler = createPaymentHandler(wallet, new PublicKey(USDC_MAINNET_MINT), connection);

const fetchWithPayment = wrap(fetch, { handlers: [paymentHandler] });

const AGENT_USER_KEY =
	firstDefined(process.env.AGENT_USER_KEY, process.env.USER_KEY) ?? keypair.publicKey.toBase58();
const AGENT_PAYER_KEY = firstDefined(process.env.AGENT_PAYER_KEY, process.env.PAYER_KEY);
const STRATEGY_ID = process.env.STRATEGY_ID ?? "";
const BASE_ASSET = process.env.BASE_ASSET ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const BALANCE_FUND_USER = firstDefined(
	process.env.BALANCE_FUND_USER,
	process.env.FUND_USER,
	process.env.AGENT_FUND_USER,
	AGENT_USER_KEY,
)!;

// Base units (USDC has 6 decimals)
const DEPOSIT_AMOUNT = Number(process.env.DEPOSIT_AMOUNT ?? "10000");
const WITHDRAW_AMOUNT = Number(process.env.WITHDRAW_AMOUNT ?? "1000");
const WITHDRAW_ALL = String(process.env.WITHDRAW_ALL ?? "false") === "true";

function payloadFor(endpoint: x402Endpoint): AgentTxPayload {
	if (endpoint === x402Endpoint.Deposit) {
		return {
			amount: DEPOSIT_AMOUNT,
			user_key: AGENT_USER_KEY,
			payer_key: AGENT_PAYER_KEY,
			strategy_id: STRATEGY_ID,
			base_asset: BASE_ASSET,
		};
	}

	return {
		amount: WITHDRAW_AMOUNT,
		user_key: AGENT_USER_KEY,
		payer_key: AGENT_PAYER_KEY,
		strategy_id: STRATEGY_ID,
		base_asset: BASE_ASSET,
		all: WITHDRAW_ALL,
	};
}

function requestFor(endpoint: x402Endpoint): {
	endpointUrl: string;
	init: RequestInit;
	payloadForLog?: string;
} {
	if (endpoint === x402Endpoint.Balance) {
		const endpointUrl = `${apiBaseUrl}${endpoint}/${encodeURIComponent(BALANCE_FUND_USER)}`;
		return {
			endpointUrl,
			init: { method: "GET" },
		};
	}

	const payload = payloadFor(endpoint);
	return {
		endpointUrl: `${apiBaseUrl}${endpoint}`,
		init: {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
		},
		payloadForLog: JSON.stringify(payload),
	};
}

async function runEndpointSmokeTest(endpoint: x402Endpoint): Promise<void> {
	const { endpointUrl, init, payloadForLog } = requestFor(endpoint);

	console.log(`\n=== x402 smoke test: ${endpoint} ===`);
	console.log(`target: ${endpointUrl}`);
	if (payloadForLog) {
		console.log("payload:", payloadForLog);
	}
	console.log("preflight: checking endpoint without payment header");

	const preflight = await fetch(endpointUrl, init);

	const preflightBody = await preflight.text();
	console.log(`preflight status: ${preflight.status}`);

	if (preflight.status === 404) {
		throw new Error(
			[
				`Got 404 at ${endpointUrl}.`,
				"This is route/config, not x402 signing.",
				"Checks:",
				"1) x402 app is started and reachable.",
				"2) Correct base URL/path.",
				`3) Endpoint exists in this server build. Body: ${preflightBody}`,
			].join("\n"),
		);
	}

	if (preflight.status === 400) {
		throw new Error(`Prevalidation failed for ${endpoint} before payment: ${preflightBody}`);
	}

	if (preflight.status !== 402) {
		console.warn(`Preflight did not return 402 (got ${preflight.status}). Continuing anyway.`);
	}

	console.log("requesting paid endpoint with automatic x402 handling");
	let response: Response;
	try {
		response = await fetchWithPayment(endpointUrl, init);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (message.includes("Non-base58 character")) {
			throw new Error(
				[
					"x402 challenge contains an invalid Solana public key (non-base58).",
					"Likely cause: X402_PAY_TO is not a valid wallet address.",
					"Set X402_PAY_TO in apps/x402/.env to a real Solana public key and restart the app.",
				].join(" "),
			);
		}
		throw error;
	}

	const responseText = await response.text();
	const paymentResponseHeader =
		response.headers.get("payment-response") ?? response.headers.get("x-payment-response");

	let parsedPaymentResponse: PaymentResponseHeader | null = null;
	if (paymentResponseHeader) {
		try {
			parsedPaymentResponse = JSON.parse(paymentResponseHeader) as PaymentResponseHeader;
		} catch {
			throw new Error(`Invalid payment-response header for ${endpoint}: expected JSON string.`);
		}
	}

	console.log(`status: ${response.status}`);
	console.log(`payment-response header: ${paymentResponseHeader ?? "<missing>"}`);
	console.log(`response body: ${responseText}`);

	if (response.status === 402) {
		throw new Error(`Payment failed for ${endpoint}: endpoint still returned HTTP 402.`);
	}

	if (endpoint === x402Endpoint.Balance) {
		let parsedBalance: unknown;
		try {
			parsedBalance = JSON.parse(responseText);
		} catch {
			throw new Error(
				`Invalid response body for ${endpoint}: expected JSON payload, got ${responseText}`,
			);
		}
		if (!parsedBalance || typeof parsedBalance !== "object") {
			throw new Error(
				`Invalid response body for ${endpoint}: expected JSON object, got ${typeof parsedBalance}`,
			);
		}
	} else {
		// check if the response body is a valid txn string
		const txn = responseText;
		if (typeof txn !== "string") {
			throw new Error(`Invalid response body for ${endpoint}: expected string, got ${typeof txn}`);
		}

		// arbitrary length check for txn string
		if (txn.length <= 25) {
			throw new Error(
				`Invalid response body for ${endpoint}: expected valid txn string, got ${txn}`,
			);
		}
	}

	console.log(
		`x402 payment succeeded for ${endpoint} (x402Version=${parsedPaymentResponse?.x402Version ?? "unknown"}, status=${response.status}).`,
	);
}

await runEndpointSmokeTest(x402Endpoint.Deposit);
await runEndpointSmokeTest(x402Endpoint.Withdraw);
await runEndpointSmokeTest(x402Endpoint.Balance);
