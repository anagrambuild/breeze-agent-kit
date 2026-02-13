import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerBreezeTools } from "./tools/register-breeze-tools.js";

const server = new McpServer({
	name: "breeze",
	version: "1.0.0",
});

registerBreezeTools(server);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Breeze MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
