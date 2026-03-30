/**
 * E2E test for the MPP-gated Breeze API.
 *
 * Prerequisites:
 *   1. Server running: `bun run dev` (from apps/mpp)
 *   2. Environment variables in .env:
 *      - E2E_WALLET_PRIVATE_KEY  (base58-encoded, needs USDC + SOL for fees)
 *      - All server vars (BREEZE_API_KEY, MPP_SECRET_KEY, MPP_PAY_TO, etc.)
 *
 * Usage:
 *   bun scripts/e2e.ts
 */

import { Mppx, solana } from "@solana/mpp/client";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { getBase58Codec } from "@solana/kit";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3403";
const WALLET_KEY = process.env.E2E_WALLET_PRIVATE_KEY;
const RPC_URL = process.env.SOLANA_RPC_URL;

if (!WALLET_KEY) {
	console.error("E2E_WALLET_PRIVATE_KEY is required. Set it in apps/mpp/.env");
	process.exit(1);
}

// Decode base58 private key → 64-byte keypair → signer
const keyBytes = getBase58Codec().encode(WALLET_KEY);
const signer = await createKeyPairSignerFromBytes(keyBytes);

console.log(`Wallet: ${signer.address}`);
console.log(`Server: ${BASE_URL}`);
console.log(`RPC: ${RPC_URL || "default"}\n`);

// Create MPP client — handles 402 → pay → retry automatically
const mppx = Mppx.create({
	methods: [
		solana.charge({
			signer,
			broadcast: true, // push mode: client broadcasts tx, sends signature to server
			...(RPC_URL ? { rpcUrl: RPC_URL } : {}),
			onProgress: (event) => {
				console.log(`  [mpp] ${event.type}`);
			},
		}),
	],
});

// ── Test helpers ────────────────────────────────────────────────────────────

async function test(name: string, url: string, init?: RequestInit) {
	console.log(`── ${name} ──`);
	console.log(`${init?.method || "GET"} ${url}`);

	try {
		const response = await mppx.fetch(url, init);
		const text = await response.text();

		console.log(`Status: ${response.status}`);

		// Try to pretty-print JSON
		try {
			const json = JSON.parse(text);
			console.log(`Response: ${JSON.stringify(json, null, 2)}`);
		} catch {
			console.log(`Response: ${text.slice(0, 500)}`);
		}

		// Show payment receipt if present
		const receipt = response.headers.get("payment-receipt");
		if (receipt) {
			console.log(`Receipt: ${receipt.slice(0, 80)}...`);
		}
	} catch (err) {
		console.error(`Error: ${err}`);
	}

	console.log();
}

// ── Run tests ───────────────────────────────────────────────────────────────

// 1. Free endpoint — no payment
console.log("=== FREE ENDPOINTS ===\n");

await test("Health check", `${BASE_URL}/healthz`);

// 2. Paid endpoints — MPP payment required
console.log("=== PAID ENDPOINTS (0.001 USDC each) ===\n");

await test("Strategy info (default)", `${BASE_URL}/strategy-info`);

await test(
	"Strategy info (explicit ID)",
	`${BASE_URL}/strategy-info/43620ba3-354c-456b-aa3c-5bf7fa46a6d4`,
);

await test("Breeze balances", `${BASE_URL}/breeze-balances/${signer.address}`);

await test("User balances", `${BASE_URL}/user-balances/${signer.address}`);

await test("User yield", `${BASE_URL}/user-yield/${signer.address}`);

console.log("=== DONE ===");
