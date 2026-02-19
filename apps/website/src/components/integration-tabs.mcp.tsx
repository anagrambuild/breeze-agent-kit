export function McpIntegrationTab() {
	return (
		<div>
			<p className="text-sm text-dim mb-6">
				Install-free MCP setup via npm package. No repo clone or local build needed.
			</p>

			<div className="border border-border rounded p-3 mb-6 text-sm">
				<p className="font-bold mb-1">Don&apos;t have an MCP-compatible runtime?</p>
				<p className="text-dim">
					MCP only works in Claude Desktop, Cursor, and similar clients. If your agent runs
					outside these environments, use the{" "}
					<a href="#x402" className="text-pink">
						x402 HTTP API
					</a>{" "}
					instead — no API key needed, just a funded Solana wallet. Or use the{" "}
					<a
						href="https://api.breeze.baby"
						target="_blank"
						rel="noopener noreferrer"
						className="text-pink"
					>
						REST API
					</a>{" "}
					with an API key from{" "}
					<a
						href="https://portal.breeze.baby"
						target="_blank"
						rel="noopener noreferrer"
						className="text-pink"
					>
						portal.breeze.baby
					</a>
					. See the full{" "}
					<a
						href="/SKILL.md"
						target="_blank"
						rel="noopener noreferrer"
						className="text-pink"
					>
						unified skill file
					</a>{" "}
					for all integration paths.
				</p>
			</div>

			<h3 className="text-sm font-bold mb-3">Setup</h3>
			<div className="text-sm mb-6 space-y-3">
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">1.</span>
					<div>
						<p>
							Get your <code className="text-pink">BREEZE_API_KEY</code> from{" "}
							<a href="https://portal.breeze.baby" target="_blank" rel="noopener noreferrer">portal.breeze.baby</a>.
						</p>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">2.</span>
					<div>
						<p>
							Export your Solana private key as base58 for{" "}
							<code className="text-pink">WALLET_PRIVATE_KEY</code>. The MCP server uses this to
							sign transactions.
						</p>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">3.</span>
					<div>
						<p>Use this MCP server config:</p>
						<pre className="mt-1.5">{`{
  "mcpServers": {
    "breeze": {
      "command": "npx",
      "args": ["-y", "@breezebaby/mcp-server"],
      "env": {
        "BREEZE_API_KEY": "your-api-key",
        "WALLET_PRIVATE_KEY": "your-base58-private-key",
        "BREEZE_STRATEGY_ID": "43620ba3-354c-456b-aa3c-5bf7fa46a6d4",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}`}</pre>
						<p className="text-xs text-dim mt-1.5">
							<code className="text-pink">BREEZE_STRATEGY_ID</code> identifies the yield strategy.
							The default above works for most use cases. Browse strategies at{" "}
							<a
								href="https://try.breeze.baby"
								target="_blank"
								rel="noopener noreferrer"
								className="text-pink"
							>
								try.breeze.baby
							</a>
							.
						</p>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">4.</span>
					<div>
						<p>Paste it into your MCP client config:</p>
						<pre className="mt-1.5">{`# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\\Claude\\claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json

# Cursor project
.cursor/mcp.json`}</pre>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">5.</span>
					<div>
						<p>
							Restart your MCP client. You should see <code className="text-pink">breeze</code> in
							the available tools list.
						</p>
					</div>
				</div>
			</div>

			<h3 className="text-sm font-bold mb-3">Tools</h3>
			<table className="w-full text-sm">
				<tbody>
					{[
						["get_strategy_info", "Strategy metadata + APY breakdown"],
						["check_balances", "Wallet positions, deposits, yield earned"],
						["get_deposit_tx", "Unsigned base64 deposit transaction"],
						["get_withdraw_tx", "Unsigned base64 withdraw transaction"],
						["sign_and_send_tx", "Sign + broadcast a base64 transaction"],
					].map(([name, desc]) => (
						<tr key={name} className="border-b border-border">
							<td className="py-1.5 pr-4 text-pink sm:whitespace-nowrap">{name}</td>
							<td className="py-1.5 text-dim">{desc}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
