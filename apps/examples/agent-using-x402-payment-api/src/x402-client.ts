import { wrap } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { PublicKey } from "@solana/web3.js";
import { config } from "./config.js";
import { keypair, connection } from "./solana.js";

const SOLANA_NETWORK = "mainnet-beta";
const USDC_MINT = new PublicKey(config.baseAsset);

const wallet = await createLocalWallet(SOLANA_NETWORK, keypair);
const paymentHandler = createPaymentHandler(wallet, USDC_MINT, connection);
const fetchWithPayment = wrap(fetch, { handlers: [paymentHandler] });

const apiBaseUrl = config.x402ApiUrl.replace(/\/$/, "");

export async function checkBalance(fundUser: string): Promise<string> {
  const url = `${apiBaseUrl}/balance/${encodeURIComponent(fundUser)}`;
  const response = await fetchWithPayment(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Balance request failed (${response.status}): ${await response.text()}`);
  }
  return response.text();
}

export async function deposit(params: {
  amount: number;
  user_key: string;
  payer_key?: string;
  strategy_id: string;
  base_asset: string;
}): Promise<string> {
  const url = `${apiBaseUrl}/deposit`;
  const response = await fetchWithPayment(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Deposit request failed (${response.status}): ${await response.text()}`);
  }
  return response.text();
}

export async function withdraw(params: {
  amount: number;
  user_key: string;
  payer_key?: string;
  strategy_id: string;
  base_asset: string;
  all?: boolean;
}): Promise<string> {
  const url = `${apiBaseUrl}/withdraw`;
  const response = await fetchWithPayment(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Withdraw request failed (${response.status}): ${await response.text()}`);
  }
  return response.text();
}
