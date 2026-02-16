export function ClawhubIntegrationTab() {
	return (
		<div>
			<p className="text-sm text-dim mb-6">
				Install the Breeze skill directly from{" "}
				<a href="https://clawhub.ai">ClawHub</a> — no manual config needed. This gives
				Claude Code the ability to automate yield on your Solana assets via the x402 payment
				API.
			</p>

			<h3 className="text-sm font-bold mb-3">Install</h3>
			<pre className="mb-6">{`npx clawhub@latest install breeze`}</pre>

			<h3 className="text-sm font-bold mb-3">What it does</h3>
			<p className="text-sm text-dim mb-6">
				Once installed, Claude Code can check DeFi balances, deposit tokens, withdraw tokens,
				and manage Solana yield positions — each API call is automatically paid for with a
				USDC micropayment via x402.
			</p>

			<p className="text-xs text-dim">
				Visit <a href="https://clawhub.ai">clawhub.ai</a> to browse available skills.
			</p>
		</div>
	);
}
