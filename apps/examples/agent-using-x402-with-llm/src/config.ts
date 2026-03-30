function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export const config = {
	anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
	walletPrivateKey: requireEnv("WALLET_PRIVATE_KEY"),
	strategyId: requireEnv("STRATEGY_ID"),
	x402ApiUrl: process.env.X402_API_URL || "https://x402.breeze.baby",
	solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
	baseAsset: process.env.BASE_ASSET || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
} as const;
