import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const dynamic = "force-dynamic";

const ROUTE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = path.resolve(
	ROUTE_DIR,
	"../../../../../skills/breeze-x402-payment-api/SKILL.md",
);

export async function GET() {
	if (!existsSync(SKILL_PATH)) {
		return new Response("Skill file not found", { status: 404 });
	}

	const markdown = readFileSync(SKILL_PATH, "utf8");
	return new Response(markdown, {
		status: 200,
		headers: {
			"content-type": "text/plain; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}
