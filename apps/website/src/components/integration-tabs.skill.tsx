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

	const installCommand =
		"npx skills add https://github.com/anagrambuild/breeze-agent-kit/apps/skills --skill breeze-x402-payment-api";

	return (
		<div>
			<div className="flex items-center justify-between mb-2">
				<p className="text-sm text-dim">
					One command to install to your favorite agent (Claude Code, ChatGPT, Gemini, etc.)
				</p>
				<SkillCopyButton text={installCommand} />
			</div>
			<pre className="mb-6">{installCommand}</pre>
			<div className="flex items-center justify-between mb-2">
				<p className="text-xs text-dim">Or copy the full skill markdown:</p>
				<SkillCopyButton text={skillMarkdown} />
			</div>
			<pre>{skillMarkdown}</pre>
		</div>
	);
}
