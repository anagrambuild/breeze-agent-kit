export function McpIntegrationTab() {
	return (
		<div>
			<p className="text-sm text-dim mb-6">
				Stdio server exposing 5 tools to any MCP-compatible client (Claude Desktop, Cursor, etc).
			</p>

			<h3 className="text-sm font-bold mb-3">Before you start (2 min)</h3>
			<div className="text-sm mb-6 space-y-3">
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">1.</span>
					<div>
						<p>Install Bun (fastest path):</p>
						<pre className="mt-1.5">{`# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"`}</pre>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">2.</span>
					<div>
						<p>
							Open a new terminal and run <code className="text-pink">bun --version</code>. If
							you see a version number, you are good.
						</p>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">3.</span>
					<div>
						<p>
							Make sure Git is installed: <code className="text-pink">git --version</code>. If
							not, install from <a href="https://git-scm.com/downloads">git-scm.com/downloads</a>.
						</p>
					</div>
				</div>
			</div>

			<h3 className="text-sm font-bold mb-3">Setup</h3>
			<div className="text-sm mb-6 space-y-3">
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">1.</span>
					<div>
						<p>Clone the repo and install dependencies:</p>
						<pre className="mt-1.5">{`git clone https://github.com/anagrambuild/breeze-agent-kit
cd breeze-agent-kit
bun install`}</pre>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">2.</span>
					<div>
						<p>
							Get your <code className="text-pink">BREEZE_API_KEY</code> from{" "}
							<a href="https://portal.breeze.baby">portal.breeze.baby</a>
						</p>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">3.</span>
					<div>
						<p>
							Export your Solana wallet private key as base58. This is the{" "}
							<code className="text-pink">WALLET_PRIVATE_KEY</code> - the agent will sign
							transactions with it.
						</p>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">4.</span>
					<div>
						<p>Open your Claude Desktop config file:</p>
						<pre className="mt-1.5">{`# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\\Claude\\claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json`}</pre>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">5.</span>
					<div>
						<p>
							Add the Breeze MCP server (replace path and keys). This runs directly with{" "}
							<code className="text-pink">bun</code>, so no build step needed:
						</p>
						<pre className="mt-1.5">{`{
  "mcpServers": {
    "breeze": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/breeze-agent-kit/apps/mcp/src/index.ts"],
      "env": {
        "BREEZE_API_KEY": "your-api-key",
        "WALLET_PRIVATE_KEY": "your-base58-private-key",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}`}</pre>
					</div>
				</div>
				<div className="flex gap-3">
					<span className="text-pink font-bold shrink-0">6.</span>
					<div>
						<p>
							Restart Claude Desktop. You should see <code className="text-pink">breeze</code> in
							the MCP tools list (hammer icon).
						</p>
					</div>
				</div>
			</div>

			<h3 className="text-sm font-bold mb-3">Cursor / other MCP clients</h3>
			<p className="text-xs text-dim mb-2">
				Same config, different file. For Cursor, put this in{" "}
				<code>.cursor/mcp.json</code> in your project root:
			</p>
			<pre className="mb-6">{`{
  "mcpServers": {
    "breeze": {
      "command": "bun",
      "args": ["run", "/path/to/breeze-agent-kit/apps/mcp/src/index.ts"],
      "env": {
        "BREEZE_API_KEY": "your-api-key",
        "WALLET_PRIVATE_KEY": "your-base58-private-key"
      }
    }
  }
}`}</pre>

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
