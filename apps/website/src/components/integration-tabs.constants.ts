export const tabs = ["MCP", "402", "Skill", "ClawHub"] as const;
export type Tab = (typeof tabs)[number];

export const hashToTab: Record<string, Tab> = {
	"#mcp": "MCP",
	"#402": "402",
	"#skill": "Skill",
	"#clawhub": "ClawHub",
};

export const tabToHash: Record<Tab, string> = {
	MCP: "#mcp",
	"402": "#402",
	Skill: "#skill",
	ClawHub: "#clawhub",
};
