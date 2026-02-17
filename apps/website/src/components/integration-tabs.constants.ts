export const tabs = ["MCP", "x402", "Skill", "ClawHub"] as const;
export type Tab = (typeof tabs)[number];

export const hashToTab: Record<string, Tab> = {
	"#mcp": "MCP",
	"#x402": "x402",
	"#skill": "Skill",
	"#clawhub": "ClawHub",
};

export const tabToHash: Record<Tab, string> = {
	MCP: "#mcp",
	x402: "#x402",
	Skill: "#skill",
	ClawHub: "#clawhub",
};
