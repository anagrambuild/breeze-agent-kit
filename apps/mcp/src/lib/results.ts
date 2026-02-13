export function asErrorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
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
