import { createInterface } from "readline";
import { runAgent } from "./agent.js";
import { connectMcp, disconnectMcp } from "./mcp.js";
import type Anthropic from "@anthropic-ai/sdk";

async function singleShot(prompt: string) {
	console.log(`Prompt: ${prompt}\n`);

	const { response } = await runAgent(prompt);
	console.log(`\n${response}\n`);
}

async function interactive() {
	console.log("Breeze Agentic Deposit Agent (MCP)");
	console.log('Type your request (or "exit" to quit)\n');

	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	let history: Anthropic.MessageParam[] = [];

	const ask = () => {
		rl.question("> ", async (input) => {
			const trimmed = input.trim();
			if (!trimmed || trimmed.toLowerCase() === "exit") {
				rl.close();
				await disconnectMcp();
				return;
			}

			try {
				const result = await runAgent(trimmed, history);
				console.log(`\n${result.response}\n`);
				history = result.history;
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.error(`Error: ${msg}\n`);
			}

			ask();
		});
	};

	ask();
}

async function main() {
	await connectMcp();

	const prompt = process.argv.slice(2).join(" ");

	if (prompt) {
		await singleShot(prompt);
		await disconnectMcp();
	} else {
		await interactive();
	}
}

main().catch(async (err) => {
	console.error("Fatal:", err.message || err);
	await disconnectMcp().catch(() => {});
	process.exit(1);
});
