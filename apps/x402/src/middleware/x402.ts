import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "@faremeter/middleware/hono";
import { solana } from "@faremeter/info";

const FACILITATOR_URL =
	process.env.X402_FACILITATOR_URL || "https://facilitator.corbits.dev";
const PAY_TO = process.env.X402_PAY_TO || "";
const NETWORK = (process.env.X402_NETWORK || "mainnet-beta") as "mainnet-beta" | "devnet";
const PRICE_USDC = process.env.X402_PRICE_USDC || "10000"; // $0.01 default

async function initPaymentWall(): Promise<MiddlewareHandler> {
	if (!PAY_TO) {
		console.warn("[x402] X402_PAY_TO not set — payment wall disabled");
		return async (_c, next) => await next();
	}

	return createMiddleware({
		facilitatorURL: FACILITATOR_URL,
		accepts: [
			solana.x402Exact({
				network: NETWORK,
				asset: "USDC",
				amount: PRICE_USDC,
				payTo: PAY_TO,
			}),
		],
	});
}

export const x402PaymentWall = await initPaymentWall();
