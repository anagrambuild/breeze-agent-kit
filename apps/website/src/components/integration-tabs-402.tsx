import { DEFAULT_STRATEGY_ID } from "@/constants";

export function X402IntegrationTab() {
	return (
		<div>
			<p className="text-sm text-dim mb-6">
				Payment-gated HTTP API at <code className="text-pink">agent.breeze.baby</code>. No API keys
				- agents pay a micro USDC fee per request using the{" "}
				<a href="https://www.faremeter.com">x402 protocol</a>.
			</p>

			<h3 className="text-sm font-bold mb-3">How x402 works</h3>
			<div className="text-sm mb-6 space-y-2">
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">1.</span>
					<span>
						Agent sends <code className="text-pink">POST /deposit</code> to{" "}
						<code>agent.breeze.baby</code>
					</span>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">2.</span>
					<span>
						Server returns <code className="text-pink">402</code> with a payment challenge header
						describing the price (USDC), network (Solana), and recipient address
					</span>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">3.</span>
					<span>Agent pays ~$0.01 USDC on-chain to the specified address</span>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">4.</span>
					<span>
						Agent retries the same request with <code className="text-pink">X-402-Payment</code>{" "}
						header containing proof of payment
					</span>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">5.</span>
					<span>
						Server validates payment, proxies to the Breeze API, returns{" "}
						<code className="text-pink">200</code> with the result
					</span>
				</div>
			</div>

			<p className="text-xs text-dim mb-4">
				The payment is ~$0.01 USDC per request. Use <code>@faremeter/fetch</code> to handle the 402
				flow automatically:
			</p>
			<pre className="mb-6">{`import { fetchWithPayment } from "@faremeter/fetch";
import { SolanaPaymentHandler } from "@faremeter/payment-solana";
import { KeypairWallet } from "@faremeter/wallet-solana";

const wallet = new KeypairWallet(yourSolanaKeypair);
const payment = new SolanaPaymentHandler(wallet);

const res = await fetchWithPayment(
  "https://agent.breeze.baby/deposit",
  { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_key: wallet.publicKey.toString(),
      strategy_id: "${DEFAULT_STRATEGY_ID}", // default agent strategy
      base_asset: "USDC",
      amount: 100000000
    })
  },
  { paymentHandler: payment }
);

const { ok, tx } = await res.json();`}</pre>

			<h3 className="text-sm font-bold mb-3">Endpoints</h3>

			<div className="mb-4">
				<p className="text-sm mb-1">
					<code className="text-pink">POST</code> <code>/deposit</code>
				</p>
				<pre>{`{
  "user_key":     "string",  // wallet pubkey (required)
  "strategy_id":  "string",  // (required)
  "base_asset":   "string",  // e.g. "USDC" (required)
  "amount":       number,    // positive, base units (required)
  "payer_key":    "string"   // optional, defaults to user_key
}`}</pre>
				<p className="text-xs text-dim mt-1">
					Returns <code>{`{ "ok": true, "tx": "base64..." }`}</code>
				</p>
			</div>

			<div className="mb-4">
				<p className="text-sm mb-1">
					<code className="text-pink">POST</code> <code>/withdraw</code>
				</p>
				<pre>{`{
  "user_key":     "string",  // wallet pubkey (required)
  "strategy_id":  "string",  // (required)
  "base_asset":   "string",  // e.g. "USDC" (required)
  "amount":       number,    // positive, base units (required)
  "payer_key":    "string",  // optional
  "all":          boolean    // optional, withdraw everything
}`}</pre>
				<p className="text-xs text-dim mt-1">
					Returns <code>{`{ "ok": true, "tx": "base64..." }`}</code>
				</p>
			</div>

			<div className="mb-6">
				<p className="text-sm mb-1">
					<code className="text-pink">GET</code> <code>/balance/:fund_user</code>
				</p>
				<p className="text-xs text-dim mt-1">
					Returns <code>{`{ "ok": true, "balances": [...] }`}</code>
				</p>
			</div>

			<h3 className="text-sm font-bold mb-3">Status codes</h3>
			<table className="w-full text-sm">
				<tbody>
					{[
						["200", "Success - transaction or balance returned"],
						["400", "Validation error - check your request body"],
						["402", "Payment required - include x402 payment proof"],
						["500", "Upstream API error"],
					].map(([code, desc]) => (
						<tr key={code} className="border-b border-border">
							<td className="py-1.5 pr-4 text-pink sm:whitespace-nowrap">{code}</td>
							<td className="py-1.5 text-dim">{desc}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
