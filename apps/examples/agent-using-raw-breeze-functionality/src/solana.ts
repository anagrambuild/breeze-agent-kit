import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { config } from "./config.js";

export const connection = new Connection(config.solanaRpcUrl, "confirmed");

export const keypair = Keypair.fromSecretKey(bs58.decode(config.walletPrivateKey));

export const walletPublicKey = keypair.publicKey.toBase58();

export async function signAndSendTransaction(encodedTx: string): Promise<{
	success: boolean;
	signature: string;
	explorerUrl: string;
}> {
	const txBuffer = Buffer.from(encodedTx, "base64");
	const transaction = VersionedTransaction.deserialize(txBuffer);

	transaction.sign([keypair]);

	const signature = await connection.sendTransaction(transaction, {
		skipPreflight: false,
		preflightCommitment: "confirmed",
	});

	await connection.confirmTransaction(signature, "confirmed");

	return {
		success: true,
		signature,
		explorerUrl: `https://solscan.io/tx/${signature}`,
	};
}
