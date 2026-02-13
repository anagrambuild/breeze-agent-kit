export function toBaseUnits(amount: number, decimals: number): number {
	if (!Number.isFinite(amount) || amount <= 0) {
		throw new Error("Amount must be a positive finite number");
	}
	return Math.floor(amount * Math.pow(10, decimals));
}

export function fromBaseUnits(amount: number, decimals: number): number {
	return amount / Math.pow(10, decimals);
}

export function fmt(v: number, decimals: number): string {
	if (!Number.isFinite(v)) return "N/A";
	if (v === 0) return "0";
	if (v < 0.01) return v.toPrecision(4);
	return v.toFixed(decimals <= 6 ? 4 : 6);
}
