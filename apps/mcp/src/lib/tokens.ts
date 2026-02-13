export type TokenInfo = {
	symbol: string;
	mint: string;
	decimals: number;
};

const TOKEN_MAP: Record<string, { mint: string; decimals: number }> = {
	USDC: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
	USDT: { mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
	USDS: { mint: "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA", decimals: 6 },
	SOL: { mint: "So11111111111111111111111111111111111111112", decimals: 9 },
	JitoSOL: { mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", decimals: 9 },
	mSOL: { mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", decimals: 9 },
	JupSOL: { mint: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v", decimals: 9 },
	JLP: { mint: "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4", decimals: 6 },
};

export const SUPPORTED_TOKEN_SYMBOLS = Object.keys(TOKEN_MAP);

export function resolveToken(symbol: string): TokenInfo {
	const normalized = symbol.trim();
	const entry = Object.entries(TOKEN_MAP).find(
		([key]) => key.toUpperCase() === normalized.toUpperCase(),
	);
	if (!entry) {
		throw new Error(`Unknown token: ${symbol}. Supported: ${SUPPORTED_TOKEN_SYMBOLS.join(", ")}`);
	}
	const [resolvedSymbol, tokenInfo] = entry;
	return { symbol: resolvedSymbol, ...tokenInfo };
}

export function tokenSymbolFromMint(mint: string): string {
	const entry = Object.entries(TOKEN_MAP).find(([, tokenInfo]) => tokenInfo.mint === mint);
	return entry ? entry[0] : mint;
}
