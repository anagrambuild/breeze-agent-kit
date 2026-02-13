import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { z } from "zod/v4";
import { balance } from "./balance.js";

const app = new Hono();
app.route("/balance", balance);

const upstreamResponse = z.object({
	ok: z.boolean(),
	balances: z.array(z.record(z.string(), z.unknown())),
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

describe("GET /balance/:fund_user", () => {
	test("proxies signed request to upstream with encoded path", async () => {
		globalThis.fetch = (async (input, init) => {
			expect(String(input)).toBe("http://localhost:8080/agent/balance/fund-user%3A1");
			expect(init?.method).toBe("GET");
			expect(init?.headers).toBeDefined();
			expect(init?.body).toBeUndefined();

			const headers = init?.headers as Record<string, string>;
			expect(headers["x-agent-key-id"]).toBe("proxy-test");
			expect(headers["x-agent-timestamp"]).toBeDefined();
			expect(headers["x-agent-nonce"]).toBeDefined();
			expect(headers["x-agent-signature"]).toBeDefined();

			return new Response(JSON.stringify({ ok: true, balances: [{ amount: "12.3" }] }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		}) as typeof fetch;

		const res = await app.request("/balance/fund-user:1", {
			method: "GET",
		});
		expect(res.status).toBe(200);

		const body = upstreamResponse.parse(await res.json());
		expect(body.ok).toBe(true);
		expect(body.balances).toHaveLength(1);
	});
});
