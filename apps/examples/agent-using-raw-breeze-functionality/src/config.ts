import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
  breezeApiKey: requireEnv("BREEZE_API_KEY"),
  strategyId: requireEnv("BREEZE_STRATEGY_ID"),
  walletPrivateKey: requireEnv("WALLET_PRIVATE_KEY"),
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
} as const;
