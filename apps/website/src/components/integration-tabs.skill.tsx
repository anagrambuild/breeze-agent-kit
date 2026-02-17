"use client";

import { useEffect, useState } from "react";

const loadingText = "Loading skill...";
const missingText = "Skill file not found. Expected /skills/breeze-x402-payment-api/SKILL.md.";

function SkillCopyButton({ text }: { text: string }) {
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
	const [skillMarkdown, setSkillMarkdown] = useState(loadingText);

	useEffect(() => {
		let cancelled = false;

		const loadSkill = async () => {
			try {
				const response = await fetch("/skills/breeze-x402-payment-api/SKILL.md", {
					cache: "force-cache",
				});
				if (!response.ok) {
					throw new Error(`failed to load skill (${response.status})`);
				}

				const markdown = await response.text();
				if (!cancelled) setSkillMarkdown(markdown || missingText);
			} catch {
				if (!cancelled) setSkillMarkdown(missingText);
			}
		};

		void loadSkill();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<p className="text-sm text-dim">Skill config for agent frameworks.</p>
				<SkillCopyButton text={skillMarkdown} />
			</div>
			<pre className="whitespace-pre-wrap break-words">{skillMarkdown}</pre>
		</div>
	);
}
