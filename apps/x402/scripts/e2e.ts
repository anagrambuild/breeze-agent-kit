#!/usr/bin/env bun
/// <reference lib="dom" />

import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { base58 } from "@scure/base";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

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

function solanaExplorerTxUrl(signature: string, network: string): string {
	const base = `https://explorer.solana.com/tx/${encodeURIComponent(signature)}`;
	if (network === "mainnet-beta") return base;
	return `${base}?cluster=${encodeURIComponent(network)}`;
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
const SIGN_AND_SEND_TX = String(process.env.SIGN_AND_SEND_TX ?? "true") === "true";

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

function isBase64Like(value: string): boolean {
	return /^[A-Za-z0-9+/=_-]+$/.test(value) && value.length >= 24;
}

function normalizeBase64(value: string): string {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
	const paddedLength = Math.ceil(normalized.length / 4) * 4;
	return normalized.padEnd(paddedLength, "=");
}

function extractTransactionString(responseText: string): string {
	const trimmed = responseText.trim();
	try {
		const parsed = JSON.parse(trimmed) as unknown;
		if (typeof parsed === "string") {
			return parsed;
		}
		throw new Error("expected response body to be a transaction string");
	} catch (error) {
		if (error instanceof SyntaxError) {
			// non-JSON payloads are accepted below
			return trimmed;
		}
		throw error;
	}
}

function signAndSerializeTransaction(txString: string): { rawTx: Uint8Array; signature: string } {
	const trimmed = txString.trim();
	const decodeAttempts: Uint8Array[] = [];

	if (isBase64Like(trimmed)) {
		const base64 = normalizeBase64(trimmed);
		decodeAttempts.push(Uint8Array.from(Buffer.from(base64, "base64")));
	}

	try {
		decodeAttempts.push(base58.decode(trimmed));
	} catch {
		// ignore decode failure; we will throw below if all attempts fail
	}

	for (const bytes of decodeAttempts) {
		if (bytes.length === 0) continue;

		try {
			const versioned = VersionedTransaction.deserialize(bytes);
			versioned.sign([keypair]);
			const signatureBytes = versioned.signatures[0];
			if (!signatureBytes) {
				throw new Error("missing signature after signing versioned transaction");
			}
			return {
				rawTx: versioned.serialize(),
				signature: base58.encode(signatureBytes),
			};
		} catch {
			// try legacy below
		}

		try {
			const legacy = Transaction.from(bytes);
			legacy.partialSign(keypair);
			if (!legacy.signature) {
				throw new Error("missing signature after signing legacy transaction");
			}
			return {
				rawTx: legacy.serialize(),
				signature: base58.encode(legacy.signature),
			};
		} catch {
			// try next decode attempt
		}
	}

	throw new Error("Unable to decode response as a Solana transaction (expected base64/base58 tx data).");
}

async function signAndSendReturnedTransaction(endpoint: x402Endpoint, txString: string): Promise<string> {
	if (!txString || txString.length < 20) {
		throw new Error(`Invalid response body for ${endpoint}: missing transaction payload.`);
	}

	const { rawTx, signature } = signAndSerializeTransaction(txString);
	const sentSignature = await connection.sendRawTransaction(rawTx, { skipPreflight: false });
	await connection.confirmTransaction(sentSignature, "confirmed");
	return sentSignature || signature;
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
		const txString = extractTransactionString(responseText);
		if (txString.length <= 25) {
			throw new Error(`Invalid response body for ${endpoint}: expected valid tx payload.`);
		}

		if (SIGN_AND_SEND_TX) {
			console.log("signing and sending transaction...");
			const signature = await signAndSendReturnedTransaction(endpoint, txString);
			console.log(`submitted and confirmed transaction for ${endpoint}: ${signature}`);
			console.log(`explorer: ${solanaExplorerTxUrl(signature, SOLANA_NETWORK)}`);
		}
	}

	console.log(
		`x402 payment succeeded for ${endpoint} (x402Version=${parsedPaymentResponse?.x402Version ?? "unknown"}, status=${response.status}).`,
	);
}

await runEndpointSmokeTest(x402Endpoint.Deposit);
await runEndpointSmokeTest(x402Endpoint.Withdraw);
await runEndpointSmokeTest(x402Endpoint.Balance);
