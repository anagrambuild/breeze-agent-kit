import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { base58 } from "@scure/base";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SOLANA_NETWORK, SOLANA_RPC_URL, USDC_MAINNET_MINT, svmPrivateKey } from "./env.js";

const keypair = Keypair.fromSecretKey(base58.decode(svmPrivateKey));
const wallet = await createLocalWallet(SOLANA_NETWORK, keypair);
const connection = new Connection(SOLANA_RPC_URL);
const paymentHandler = createPaymentHandler(wallet, new PublicKey(USDC_MAINNET_MINT), connection);
const fetchWithPayment = wrap(fetch, { handlers: [paymentHandler] });

export { keypair, connection, fetchWithPayment };
