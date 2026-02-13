import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { z } from "zod/v4";
import { deposit } from "./deposit.js";

const app = new Hono();
app.route("/deposit", deposit);

const json = (body: unknown) =>
	app.request("/deposit", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

const upstreamResponse = z.object({
	ok: z.boolean(),
	tx: z.string(),
});

const originalFetch = globalThis.fetch;

beforeEach(() => {
	process.env.RUST_API_BASE_URL = "http://localhost:8080";
	process.env.AGENT_PROXY_KEY_ID = "proxy-test";
	process.env.AGENT_PROXY_SECRET = "super-secret";
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("POST /deposit", () => {
	test("proxies signed request to upstream", async () => {
		globalThis.fetch = (async (input, init) => {
			expect(String(input)).toBe("http://localhost:8080/agent/deposit/tx");
			expect(init?.method).toBe("POST");
			expect(init?.headers).toBeDefined();

			const headers = init?.headers as Record<string, string>;
			expect(headers["x-agent-key-id"]).toBe("proxy-test");
			expect(headers["x-agent-timestamp"]).toBeDefined();
			expect(headers["x-agent-nonce"]).toBeDefined();
			expect(headers["x-agent-signature"]).toBeDefined();

			const raw = init?.body as Buffer;
			const parsed = JSON.parse(raw.toString("utf8"));
			expect(parsed).toEqual({
				params: {
					user_key: "user-1",
					payer_key: "payer-1",
					strategy_id: "strat-1",
					base_asset: "USDC",
					amount: 100,
				},
			});

			return new Response(JSON.stringify({ ok: true, tx: "dep-123" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		}) as typeof fetch;

		const res = await json({
			user_key: "user-1",
			payer_key: "payer-1",
			strategy_id: "strat-1",
			base_asset: "USDC",
			amount: 100,
		});
		expect(res.status).toBe(200);

		const body = upstreamResponse.parse(await res.json());
		expect(body.ok).toBe(true);
		expect(body.tx).toBe("dep-123");
	});

	test("400 when required fields are missing", async () => {
		const res = await json({ amount: 100, user_key: "user-1" });
		expect(res.status).toBe(400);
	});

	test("400 when amount is negative", async () => {
		const res = await json({
			user_key: "user-1",
			strategy_id: "strat-1",
			base_asset: "USDC",
			amount: -5,
		});
		expect(res.status).toBe(400);
	});
});
