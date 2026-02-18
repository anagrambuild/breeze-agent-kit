import { IntegrationTabs } from "@/components/integration-tabs";
import { SITE_URL } from "@/constants";

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "Breeze Agent Kit",
	description:
		"Solana yield strategies for AI agents. Deposit, withdraw, and check balances via MCP, x402, or direct SDK integration.",
	url: SITE_URL,
	applicationCategory: "DeveloperApplication",
	operatingSystem: "Any",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
};

export default function Home() {
	return (
		<main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			{/* Header */}
			<header className="mb-16">
				<h1 className="text-3xl font-bold tracking-tight md:text-4xl">Breeze Agent Kit</h1>
				<p className="mt-3 text-dim text-sm">
					Solana yield strategies for AI agents.
					<br />
					Four paths: <strong className="text-fg">MCP</strong>,{" "}
					<strong className="text-fg">402</strong>, <strong className="text-fg">Skill</strong>, or{" "}
					<strong className="text-fg">ClawHub</strong>.
				</p>
				<div className="mt-4 flex gap-4 text-sm">
					<a href="https://github.com/anagrambuild/breeze-agent-kit" target="_blank" rel="noopener noreferrer">GitHub</a>
					<a href="https://try.breeze.baby" target="_blank" rel="noopener noreferrer">Human?</a>
				</div>
			</header>

			{/* Tokens */}
			<section className="mb-12">
				<p className="text-xs text-dim mb-3">Supported tokens</p>
				<div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
					{[
						["USDC", "6"],
						["SOL", "9"],
						["JitoSOL", "9"],
						["mSOL", "9"],
						["JupSOL", "9"],
						["USDT", "6"],
						["USDS", "6"],
						["JLP", "6"],
					].map(([symbol, dec]) => (
						<div key={symbol}>
							<span className="text-fg">{symbol}</span>{" "}
							<span className="text-dim text-xs">{dec}d</span>
						</div>
					))}
				</div>
			</section>

			{/* Integration tabs */}
			<IntegrationTabs />

			{/* Footer */}
			<footer className="border-t border-border pt-6 text-xs text-dim">
				<a href="https://github.com/anagrambuild" target="_blank" rel="noopener noreferrer">Anagram</a> /{" "}
				<a href="https://www.breeze.baby/" target="_blank" rel="noopener noreferrer">Breeze</a>
			</footer>
		</main>
	);
}
