#!/usr/bin/env bun
/// <reference lib="dom" />

import { fetchWithPayment } from "./client.js";
import { SIGN_AND_SEND_TX } from "./env.js";
import { requestFor } from "./request.js";
import { PaymentResponseHeader, X402Endpoint } from "./types.js";
import {
	extractTransactionString,
	signAndSendReturnedTransaction,
	solanaExplorerTxUrl,
} from "./transaction.js";

async function run402Test(endpoint: X402Endpoint): Promise<void> {
	const { endpointUrl, init, payloadForLog } = requestFor(endpoint);

	console.log(`\n=== x402 e2e test: ${endpoint} ===`);
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
					"Set X402_PAY_TO in your x402 server .env to a real Solana public key and restart the app.",
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

	if (endpoint === X402Endpoint.Balance) {
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
			console.log(`explorer: ${solanaExplorerTxUrl(signature)}`);
		}
	}

	console.log(
		`x402 payment succeeded for ${endpoint} (x402Version=${parsedPaymentResponse?.x402Version ?? "unknown"}, status=${response.status}).`,
	);
}

async function main() {
	await run402Test(X402Endpoint.Deposit);
	await run402Test(X402Endpoint.Withdraw);
	await run402Test(X402Endpoint.Balance);
}

main().catch((err) => {
	console.error("Fatal:", err instanceof Error ? err.message : String(err));
	throw err;
});
