import type { MiddlewareHandler } from "hono";
import { Mppx, solana, Store } from "@solana/mpp/server";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const PAY_TO = process.env.MPP_PAY_TO;
const SECRET_KEY = process.env.MPP_SECRET_KEY;
const PRICE_USDC = process.env.MPP_PRICE_USDC || "1000"; // 0.001 USDC in base units
const NETWORK = "mainnet-beta";
const RPC_URL = process.env.SOLANA_RPC_URL;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mppx: any = null;

async function getMppx() {
	if (mppx) return mppx;

	if (!PAY_TO || !SECRET_KEY) {
		console.warn("[mpp] MPP_PAY_TO or MPP_SECRET_KEY not set — payment wall disabled");
		return null;
	}

	mppx = await Mppx.create({
		secretKey: SECRET_KEY,
		methods: [
			solana.charge({
				recipient: PAY_TO,
				currency: USDC_MINT,
				decimals: 6,
				network: NETWORK,
				...(RPC_URL ? { rpcUrl: RPC_URL } : {}),
				store: Store.memory(),
			}),
		],
	});

	return mppx;
}

/**
 * MPP payment middleware for Hono.
 * Returns 402 challenge if unpaid, otherwise passes through with receipt on response.
 */
export const mppPaymentWall: MiddlewareHandler = async (c, next) => {
	const instance = await getMppx();

	if (!instance) {
		await next();
		return;
	}

	const result = await instance.charge({
		amount: PRICE_USDC,
		currency: USDC_MINT,
		description: "Breeze API call",
	})(c.req.raw);

	if (result.status === 402) {
		const challenge = await result.challenge;
		return challenge;
	}

	await next();

	// Wrap the response with payment receipt headers
	c.res = result.withReceipt(c.res);
};
