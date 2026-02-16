import { createInterface } from "readline";
import { runAgent } from "./agent.js";
import { walletPublicKey } from "./solana.js";
import type Anthropic from "@anthropic-ai/sdk";

async function singleShot(prompt: string) {
	console.log(`\nWallet: ${walletPublicKey}`);
	console.log(`Prompt: ${prompt}\n`);

	const { response } = await runAgent(prompt);
	console.log(`\n${response}\n`);
}

async function interactive() {
	console.log("Breeze Agentic Deposit Agent");
	console.log(`Wallet: ${walletPublicKey}`);
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

// Entry point
const prompt = process.argv.slice(2).join(" ");

if (prompt) {
	singleShot(prompt).catch((err) => {
		console.error("Fatal:", err.message || err);
		process.exit(1);
	});
} else {
	interactive();
}
