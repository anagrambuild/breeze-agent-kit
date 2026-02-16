"use client";

import { useState } from "react";

const skillMarkdown = `# Breeze Skill

A custom skill that lets your agent manage Solana yield
positions through natural language.

## Install

\`\`\`bash
npx breeze-skill install
\`\`\`

## Usage

Add to your agent config:

\`\`\`json
{
  "skills": {
    "breeze": {
      "version": "latest",
      "config": {
        "strategyId": "breeze-usdc-default",
        "network": "mainnet"
      }
    }
  }
}
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| \`/breeze deposit <amount> <token>\` | Deposit into strategy |
| \`/breeze withdraw <amount> <token>\` | Withdraw from strategy |
| \`/breeze balance\` | Show current positions |
| \`/breeze apy\` | Show current APY breakdown |
| \`/breeze status\` | Strategy health + stats |

## Example

\`\`\`
> /breeze deposit 100 USDC

Depositing 100 USDC into breeze-usdc-default...
Transaction signed and confirmed (1.2s)
New balance: 1,340.00 USDC deposited
Current APY: 8.0%
\`\`\`
`;

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			onClick={async () => {
				await navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
			className="cursor-pointer border border-border px-2 py-1 text-xs hover:bg-[#111] transition-colors"
		>
			{copied ? "copied" : "copy"}
		</button>
	);
}

export function SkillIntegrationTab() {
	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<p className="text-sm text-dim">Skill config for agent frameworks.</p>
				<CopyButton text={skillMarkdown} />
			</div>
			<pre className="whitespace-pre-wrap">{skillMarkdown}</pre>
		</div>
	);
}
