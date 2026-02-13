import crypto from "crypto";
import { z } from "zod/v4";

const httpMethodSchema = z
	.string()
	.trim()
	.min(1)
	.regex(/^[A-Za-z]+$/, "method must only contain letters");

const signInputSchema = z.object({
	method: httpMethodSchema, // e.g. "POST"
	path: z
		.string()
		.trim()
		.min(1)
		.startsWith("/")
		.refine((p) => !p.includes("?") && !p.includes("#"), "path must be path-only"),
	body: z.unknown().optional(),
	keyId: z.string().trim().min(1),
	secret: z.string().min(1),
	timestamp: z.number().int().nonnegative().optional(), // unix seconds
	nonce: z.string().trim().min(1).optional(), // typically uuid
});

type SignInput = z.input<typeof signInputSchema>;
type SignResult = {
	headers: {
		"x-agent-key-id": string;
		"x-agent-timestamp": string;
		"x-agent-nonce": string;
		"x-agent-signature": string;
		"content-type"?: "application/json";
	};
	bodyBytes: Buffer;
	canonical: string;
};

function toBodyBytes(body: unknown): Buffer {
	if (body === undefined) return Buffer.alloc(0);
	if (Buffer.isBuffer(body)) return body;
	if (typeof body === "string") return Buffer.from(body, "utf8");
	return Buffer.from(JSON.stringify(body ?? null), "utf8");
}

function hashSha256Hex(input: Buffer): string {
	return crypto
		.createHash("sha256")
		.update(input as unknown as Uint8Array)
		.digest("hex");
}

function signCanonicalHex(canonical: string, secret: string): string {
	return crypto.createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
}

export function signAgentRequest(input: SignInput): SignResult {
	const parsed = signInputSchema.parse(input);
	const timestamp = parsed.timestamp ?? Math.floor(Date.now() / 1000);
	const nonce = parsed.nonce ?? crypto.randomUUID();
	const methodUpper = parsed.method.toUpperCase();

	// Must match the exact bytes sent over HTTP.
	const bodyBytes = toBodyBytes(parsed.body);
	const bodyHashHex = hashSha256Hex(bodyBytes);
	const canonical = `${methodUpper}\n${parsed.path}\n${timestamp}\n${nonce}\n${bodyHashHex}`;
	const signatureHex = signCanonicalHex(canonical, parsed.secret);

	return {
		headers: {
			"x-agent-key-id": parsed.keyId,
			"x-agent-timestamp": String(timestamp),
			"x-agent-nonce": nonce,
			"x-agent-signature": signatureHex,
			...(bodyBytes.length > 0 ? { "content-type": "application/json" } : {}),
		},
		bodyBytes,
		canonical,
	};
}
