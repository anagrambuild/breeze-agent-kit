"use client";

import { useState } from "react";

const installCommand = "npx clawhub@latest install breeze-x402-payment-api";

function ClawhubCopyButton({ text }: { text: string }) {
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

export function ClawhubIntegrationTab() {
	return (
		<div>
			<div className="flex items-center justify-between mb-2">
				<p className="text-sm text-dim">
					Install the Breeze x402 payment API with{" "}
					<a
						href="https://clawhub.ai"
						target="_blank"
						rel="noopener noreferrer"
						className="text-fg hover:text-pink transition-colors"
					>
						ClawHub
					</a>
				</p>
				<ClawhubCopyButton text={installCommand} />
			</div>
			<pre className="mb-6">{installCommand}</pre>
			<p className="text-xs text-dim">
				<a
					href="https://clawhub.ai/keeganthomp/breeze-x402-payment-api"
					target="_blank"
					rel="noopener noreferrer"
					className="text-fg hover:text-pink transition-colors"
				>
					View on ClawHub
				</a>
			</p>
		</div>
	);
}
