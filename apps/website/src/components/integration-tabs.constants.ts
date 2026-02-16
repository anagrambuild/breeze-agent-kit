export const tabs = ["MCP", "402", "Skill", "Openclaw"] as const;
export type Tab = (typeof tabs)[number];

export const hashToTab: Record<string, Tab> = {
	"#mcp": "MCP",
	"#402": "402",
	"#skill": "Skill",
	"#openclaw": "Openclaw",
};

export const tabToHash: Record<Tab, string> = {
	MCP: "#mcp",
	"402": "#402",
	Skill: "#skill",
	Openclaw: "#openclaw",
};
