"use client";

import { useEffect, useState } from "react";
import { tabs, hashToTab, tabToHash, type Tab } from "./integration-tabs.constants";
import { McpIntegrationTab } from "./integration-tabs.mcp";
import { X402IntegrationTab } from "./integration-tabs-402";
import { SkillIntegrationTab } from "./integration-tabs.skill";
import { OpenclawIntegrationTab } from "./integration-tabs.openclaw";

export function IntegrationTabs() {
	const [active, setActive] = useState<Tab>(() => {
		if (typeof window !== "undefined") {
			return hashToTab[window.location.hash.toLowerCase()] ?? "MCP";
		}
		return "MCP";
	});

	useEffect(() => {
		const onHash = () => {
			const tab = hashToTab[window.location.hash.toLowerCase()];
			if (tab) setActive(tab);
		};
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);

	const switchTab = (tab: Tab) => {
		setActive(tab);
		window.history.replaceState(null, "", tabToHash[tab]);
	};

	return (
		<section className="mb-16">
			<div className="flex gap-0 border-b border-border mb-6">
				{tabs.map((tab) => (
					<button
						key={tab}
						onClick={() => switchTab(tab)}
						className={`cursor-pointer px-4 py-2 text-sm font-bold transition-colors ${
							active === tab ? "text-pink border-b-2 border-pink -mb-px" : "text-dim hover:text-fg"
						}`}
					>
						{tab}
					</button>
				))}
			</div>

			{active === "MCP" && <McpIntegrationTab />}
			{active === "402" && <X402IntegrationTab />}
			{active === "Skill" && <SkillIntegrationTab />}
			{active === "Openclaw" && <OpenclawIntegrationTab />}
		</section>
	);
}
