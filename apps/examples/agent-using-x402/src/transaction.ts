import { base58 } from "@scure/base";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { connection, keypair } from "./client.js";
import { SOLANA_NETWORK } from "./env.js";
import { X402Endpoint } from "./types.js";

function solanaExplorerTxUrl(signature: string): string {
	const base = `https://explorer.solana.com/tx/${encodeURIComponent(signature)}`;
	if (SOLANA_NETWORK === "mainnet-beta") return base;
	return `${base}?cluster=${encodeURIComponent(SOLANA_NETWORK)}`;
}

function isBase64Like(value: string): boolean {
	return /^[A-Za-z0-9+/=_-]+$/.test(value) && value.length >= 24;
}

function normalizeBase64(value: string): string {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
	const paddedLength = Math.ceil(normalized.length / 4) * 4;
	return normalized.padEnd(paddedLength, "=");
}

function extractTransactionString(responseText: string): string {
	const trimmed = responseText.trim();
	try {
		const parsed = JSON.parse(trimmed) as unknown;
		if (typeof parsed === "string") {
			return parsed;
		}
		throw new Error("expected response body to be a transaction string");
	} catch (error) {
		if (error instanceof SyntaxError) {
			return trimmed;
		}
		throw error;
	}
}

function signAndSerializeTransaction(txString: string): { rawTx: Uint8Array; signature: string } {
	const trimmed = txString.trim();
	const decodeAttempts: Uint8Array[] = [];

	if (isBase64Like(trimmed)) {
		const base64 = normalizeBase64(trimmed);
		decodeAttempts.push(Uint8Array.from(Buffer.from(base64, "base64")));
	}

	try {
		decodeAttempts.push(base58.decode(trimmed));
	} catch {
		// ignore decode failure; we will throw below if all attempts fail
	}

	for (const bytes of decodeAttempts) {
		if (bytes.length === 0) continue;

		try {
			const versioned = VersionedTransaction.deserialize(bytes);
			versioned.sign([keypair]);
			const signatureBytes = versioned.signatures[0];
			if (!signatureBytes) {
				throw new Error("missing signature after signing versioned transaction");
			}
			return {
				rawTx: versioned.serialize(),
				signature: base58.encode(signatureBytes),
			};
		} catch {
			// try legacy below
		}

		try {
			const legacy = Transaction.from(bytes);
			legacy.partialSign(keypair);
			if (!legacy.signature) {
				throw new Error("missing signature after signing legacy transaction");
			}
			return {
				rawTx: legacy.serialize(),
				signature: base58.encode(legacy.signature),
			};
		} catch {
			// try next decode attempt
		}
	}

	throw new Error(
		"Unable to decode response as a Solana transaction (expected base64/base58 tx data).",
	);
}

async function signAndSendReturnedTransaction(
	endpoint: X402Endpoint,
	txString: string,
): Promise<string> {
	if (!txString || txString.length < 20) {
		throw new Error(`Invalid response body for ${endpoint}: missing transaction payload.`);
	}

	const { rawTx, signature } = signAndSerializeTransaction(txString);
	const sentSignature = await connection.sendRawTransaction(rawTx, { skipPreflight: false });
	await connection.confirmTransaction(sentSignature, "confirmed");
	return sentSignature || signature;
}

export { solanaExplorerTxUrl, extractTransactionString, signAndSendReturnedTransaction };
