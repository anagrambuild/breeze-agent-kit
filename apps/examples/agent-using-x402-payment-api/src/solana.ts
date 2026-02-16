import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { base58 } from "@scure/base";
import { config } from "./config.js";

export const connection = new Connection(config.solanaRpcUrl, "confirmed");

export const keypair = Keypair.fromSecretKey(
  base58.decode(config.walletPrivateKey)
);

export const walletPublicKey = keypair.publicKey.toBase58();

function isBase64Like(value: string): boolean {
  return /^[A-Za-z0-9+/=_-]+$/.test(value) && value.length >= 24;
}

function normalizeBase64(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  const paddedLength = Math.ceil(normalized.length / 4) * 4;
  return normalized.padEnd(paddedLength, "=");
}

export function extractTransactionString(responseText: string): string {
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

export async function signAndSendTransaction(txString: string): Promise<{
  success: boolean;
  signature: string;
  explorerUrl: string;
}> {
  const trimmed = txString.trim();
  const decodeAttempts: Uint8Array[] = [];

  if (isBase64Like(trimmed)) {
    const b64 = normalizeBase64(trimmed);
    decodeAttempts.push(Uint8Array.from(Buffer.from(b64, "base64")));
  }

  try {
    decodeAttempts.push(base58.decode(trimmed));
  } catch {
    // ignore decode failure
  }

  for (const bytes of decodeAttempts) {
    if (bytes.length === 0) continue;

    // Try versioned transaction first
    try {
      const versioned = VersionedTransaction.deserialize(bytes);
      versioned.sign([keypair]);
      const rawTx = versioned.serialize();
      const signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
      });
      await connection.confirmTransaction(signature, "confirmed");
      return {
        success: true,
        signature,
        explorerUrl: `https://solscan.io/tx/${signature}`,
      };
    } catch {
      // try legacy below
    }

    // Try legacy transaction
    try {
      const legacy = Transaction.from(bytes);
      legacy.partialSign(keypair);
      const rawTx = legacy.serialize();
      const signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
      });
      await connection.confirmTransaction(signature, "confirmed");
      return {
        success: true,
        signature,
        explorerUrl: `https://solscan.io/tx/${signature}`,
      };
    } catch {
      // try next decode attempt
    }
  }

  throw new Error(
    "Unable to decode response as a Solana transaction (expected base64/base58 tx data)."
  );
}
