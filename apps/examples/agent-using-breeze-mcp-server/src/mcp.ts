import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type Anthropic from "@anthropic-ai/sdk";
import { resolve, join } from "path";
import { existsSync } from "fs";
import { config } from "./config.js";

let client: Client;
let transport: StdioClientTransport;

function resolveEntrypoint(serverDir: string): string {
  const candidates = ["dist/index.js", "build/index.js"];
  for (const candidate of candidates) {
    if (existsSync(join(serverDir, candidate))) return candidate;
  }
  throw new Error(
    `No built MCP server found in ${serverDir}. Run "npm run build" in the MCP server directory first.`
  );
}

export async function connectMcp(): Promise<void> {
  const serverPath = resolve(config.mcpServerPath);
  const entrypoint = resolveEntrypoint(serverPath);

  transport = new StdioClientTransport({
    command: "node",
    args: [entrypoint],
    cwd: serverPath,
    env: { ...process.env } as Record<string, string>,
  });

  client = new Client({ name: "breeze-agent", version: "1.0.0" });
  await client.connect(transport);
}

export async function listTools(): Promise<Anthropic.Tool[]> {
  const { tools } = await client.listTools();

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || "",
    input_schema: tool.inputSchema as Anthropic.Tool["input_schema"],
  }));
}

export async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const result = await client.callTool({ name, arguments: args });

  const textParts = (result.content as Array<{ type: string; text?: string }>)
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!);

  return textParts.join("\n") || "(no response)";
}

export async function disconnectMcp(): Promise<void> {
  await client?.close();
}
