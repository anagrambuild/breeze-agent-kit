export interface TokenInfo {
	mint: string;
	decimals: number;
}

export const TOKEN_MAP: Record<string, TokenInfo> = {
	USDC: {
		mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
		decimals: 6,
	},
	USDT: {
		mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
		decimals: 6,
	},
	USDS: {
		mint: "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA",
		decimals: 6,
	},
	SOL: {
		mint: "So11111111111111111111111111111111111111112",
		decimals: 9,
	},
	JitoSOL: {
		mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
		decimals: 9,
	},
	mSOL: {
		mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
		decimals: 9,
	},
	JupSOL: {
		mint: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
		decimals: 9,
	},
	JLP: {
		mint: "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
		decimals: 6,
	},
};

export function resolveToken(symbol: string): TokenInfo {
	const upper = symbol.toUpperCase();
	// Handle case-insensitive lookup with special cases
	const key = Object.keys(TOKEN_MAP).find((k) => k.toUpperCase() === upper);
	if (!key) {
		throw new Error(`Unknown token: ${symbol}. Supported: ${Object.keys(TOKEN_MAP).join(", ")}`);
	}
	return TOKEN_MAP[key];
}

export function toBaseUnits(amount: number, decimals: number): number {
	return Math.floor(amount * Math.pow(10, decimals));
}

export function fromBaseUnits(amount: number, decimals: number): number {
	return amount / Math.pow(10, decimals);
}
