function normalizeBreezeErrorMessage(raw: string): string {
	const lower = raw.toLowerCase();

	if (
		lower.includes("fundnotlivefordeposit") ||
		(lower.includes("not live") && lower.includes("deposit"))
	) {
		return "Deposit blocked: this fund is not `Live` (likely `Paused` or `WithdrawOnly`). Ask an admin to set fund status to `Live` or use another fund.";
	}

	if (
		lower.includes("fundnotliveorwithdrawonlyforwithdraw") ||
		(lower.includes("not live") && lower.includes("withdraw")) ||
		(lower.includes("withdraw") && lower.includes("paused"))
	) {
		return "Withdraw blocked: this fund appears `Paused`. Withdraws are allowed only when fund status is `Live` or `WithdrawOnly`.";
	}

	if (
		lower.includes("fundnotliveorwithdrawonlyforrebalance") ||
		(lower.includes("rebalance") && lower.includes("paused"))
	) {
		return "Rebalance blocked: this fund appears `Paused`. Rebalancing is allowed only when status is `Live` or `WithdrawOnly`.";
	}

	return raw;
}

export function asErrorMessage(err: unknown): string {
	const raw = err instanceof Error ? err.message : String(err);
	return normalizeBreezeErrorMessage(raw);
}

export function textResult(text: string) {
	return { content: [{ type: "text" as const, text }] };
}

export function jsonResult(payload: unknown) {
	return textResult(JSON.stringify(payload, null, 2));
}

export function errorResult(err: unknown) {
	return textResult(`Error: ${asErrorMessage(err)}`);
}
