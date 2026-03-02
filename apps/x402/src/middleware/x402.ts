import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "@faremeter/middleware/hono";
import { solana } from "@faremeter/info";

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || "https://facilitator.corbits.dev";
const PAY_TO = process.env.X402_PAY_TO || "";
const NETWORK = (process.env.X402_NETWORK || "mainnet-beta") as "mainnet-beta" | "devnet";
const PRICE_USDC = process.env.X402_PRICE_USDC || "1000"; // $0.001 default

function asStringOrNull(value: unknown): string | null | undefined {
	if (typeof value === "string" || value === null) return value;
	return undefined;
}

function requestUrl(input: unknown): string {
	if (typeof input === "string") return input;
	if (input instanceof URL) return input.toString();
	if (input && typeof input === "object" && "url" in input) {
		const url = (input as { url?: unknown }).url;
		if (typeof url === "string") return url;
	}
	return "";
}

function isSettleRequest(input: unknown): boolean {
	const rawUrl = requestUrl(input);
	if (!rawUrl) return false;

	try {
		const pathname = new URL(rawUrl, "http://localhost").pathname;
		return pathname.replace(/\/+$/, "") === "/settle";
	} catch {
		const noQuery = rawUrl.replace(/[?#].*$/, "");
		return noQuery.replace(/\/+$/, "").endsWith("/settle");
	}
}

/**
 * Corbits facilitator may return v1 settle fields:
 * - transaction / network
 * while @faremeter/middleware expects:
 * - txHash / networkId
 *
 * Normalize settle responses so middleware validation succeeds.
 */
async function facilitatorCompatFetch(
	input: Parameters<typeof fetch>[0],
	init?: Parameters<typeof fetch>[1],
): Promise<Response> {
	const response = await fetch(input, init);
	if (!isSettleRequest(input)) return response;
	if (response.status === 204 || response.bodyUsed) return response;

	const contentType = response.headers.get("content-type")?.toLowerCase() || "";
	if (!contentType.includes("application/json")) return response;

	let body: unknown;
	try {
		body = await response.clone().json();
	} catch {
		return response;
	}

	if (!body || typeof body !== "object") return response;
	const record = body as Record<string, unknown>;
	const currentTxHash = asStringOrNull(record.txHash);
	const currentNetworkId = asStringOrNull(record.networkId);
	const legacyTxHash = asStringOrNull(record.transaction);
	const legacyNetwork = asStringOrNull(record.network);
	const needsTxHash = currentTxHash === undefined && legacyTxHash !== undefined;
	const needsNetworkId = currentNetworkId === undefined && legacyNetwork !== undefined;
	if (!needsTxHash && !needsNetworkId) return response;

	const normalized = {
		...record,
		txHash: currentTxHash ?? legacyTxHash ?? null,
		networkId: currentNetworkId ?? legacyNetwork ?? null,
	};

	const headers = new Headers(response.headers);
	headers.delete("content-length");
	return new Response(JSON.stringify(normalized), {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

async function initPaymentWall(): Promise<MiddlewareHandler> {
	if (!PAY_TO) {
		console.warn("[x402] X402_PAY_TO not set — payment wall disabled");
		return async (_c, next) => await next();
	}

	return createMiddleware({
		facilitatorURL: FACILITATOR_URL,
		fetch: facilitatorCompatFetch,
		accepts: [
			solana.x402Exact({
				network: NETWORK,
				asset: "USDC",
				amount: PRICE_USDC,
				payTo: PAY_TO,
			}),
		],
		// createMiddleware() runtime accepts fetch, but current typings lag.
	} as any);
}

export const x402PaymentWall = await initPaymentWall();
