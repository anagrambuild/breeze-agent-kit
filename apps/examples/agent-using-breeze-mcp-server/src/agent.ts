import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { listTools, callTool } from "./mcp.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM_PROMPT = `You are a Solana DeFi agent that manages deposits and withdrawals on Breeze, a yield aggregator.

Available actions:
- Get strategy info (APY, supported assets)
- Check balances/positions on Breeze
- Deposit tokens into Breeze strategies for yield
- Withdraw tokens from Breeze strategies
- Sign and send transactions to the Solana blockchain

Supported tokens: USDC, USDT, USDS, SOL, JitoSOL, mSOL, JupSOL, JLP

When depositing or withdrawing:
1. First get the unsigned transaction using get_deposit_tx or get_withdraw_tx
2. Then sign and send it using sign_and_send_tx
3. Report the transaction signature and explorer link to the user

Always check balances first if the user asks about their positions or yield.
Be concise in your responses. Report results clearly with amounts and transaction links.`;

const MAX_TOOL_ROUNDS = 10;

export async function runAgent(
	userMessage: string,
	conversationHistory: Anthropic.MessageParam[] = [],
): Promise<{
	response: string;
	history: Anthropic.MessageParam[];
}> {
	const tools = await listTools();

	const messages: Anthropic.MessageParam[] = [
		...conversationHistory,
		{ role: "user", content: userMessage },
	];

	for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
		const response = await client.messages.create({
			model: "claude-opus-4-6",
			max_tokens: 4096,
			system: SYSTEM_PROMPT,
			tools,
			messages,
		});

		if (response.stop_reason === "end_turn") {
			const textBlocks = response.content.filter(
				(block): block is Anthropic.TextBlock => block.type === "text",
			);
			const text = textBlocks.map((b) => b.text).join("\n");

			messages.push({ role: "assistant", content: response.content });

			return { response: text, history: messages };
		}

		if (response.stop_reason === "tool_use") {
			messages.push({ role: "assistant", content: response.content });

			const toolUseBlocks = response.content.filter(
				(block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
			);

			const toolResults: Anthropic.ToolResultBlockParam[] = [];

			for (const toolUse of toolUseBlocks) {
				console.log(`  [Tool] ${toolUse.name}(${JSON.stringify(toolUse.input)})`);

				const result = await callTool(toolUse.name, toolUse.input as Record<string, unknown>);

				console.log(`  [Result] ${result.substring(0, 200)}${result.length > 200 ? "..." : ""}`);

				toolResults.push({
					type: "tool_result",
					tool_use_id: toolUse.id,
					content: result,
				});
			}

			messages.push({ role: "user", content: toolResults });
			continue;
		}

		// Unexpected stop reason — return whatever we have
		const fallbackText = response.content
			.filter((block): block is Anthropic.TextBlock => block.type === "text")
			.map((b) => b.text)
			.join("\n");

		messages.push({ role: "assistant", content: response.content });

		return {
			response: fallbackText || "(No response)",
			history: messages,
		};
	}

	return {
		response: "Reached maximum tool call rounds. Please try a simpler request.",
		history: messages,
	};
}
