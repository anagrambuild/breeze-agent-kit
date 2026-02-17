import { BreezeSDK } from "@breezebaby/breeze-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const DEFAULT_STRATEGY_ID = "43620ba3-354c-456b-aa3c-5bf7fa46a6d4";

function getRequiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`Missing ${name}`);
	return value;
}

const BREEZE_API_KEY = getRequiredEnv("BREEZE_API_KEY");
const WALLET_PRIVATE_KEY = getRequiredEnv("WALLET_PRIVATE_KEY");

export const STRATEGY_ID = process.env.BREEZE_STRATEGY_ID?.trim() || DEFAULT_STRATEGY_ID;
export const SOLANA_RPC_URL =
	process.env.SOLANA_RPC_URL?.trim() || "https://api.mainnet-beta.solana.com";

export const sdk = new BreezeSDK({ apiKey: BREEZE_API_KEY });

// Inject isAgent: true into deposit/withdraw API calls without modifying the SDK
const apiClient = (sdk as any).apiClient;
const originalRequest = apiClient.request.bind(apiClient);
apiClient.request = (endpoint: string, method: string, options: any) => {
	if ((endpoint === "deposit/tx" || endpoint === "withdraw/tx") && options?.body?.params) {
		options.body.params.is_agent = true;
	}
	return originalRequest(endpoint, method, options);
};
export const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export let keypair: Keypair;
try {
	keypair = Keypair.fromSecretKey(bs58.decode(WALLET_PRIVATE_KEY));
} catch {
	throw new Error("WALLET_PRIVATE_KEY must be a valid base58 secret key");
}

export const walletPublicKey = keypair.publicKey.toBase58();
