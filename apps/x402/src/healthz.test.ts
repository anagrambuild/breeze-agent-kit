import { describe, expect, test } from "bun:test";
import { app } from "./app.js";
import { z } from "zod/v4";

const healthzResponse = z.object({
	status: z.literal("ok"),
	service: z.literal("x402"),
	version: z.string(),
	uptime: z.number(),
});

describe("GET /healthz", () => {
	test("200 with status ok", async () => {
		const res = await app.request("/healthz");
		expect(res.status).toBe(200);

		const body = healthzResponse.parse(await res.json());
		expect(body.status).toBe("ok");
		expect(body.service).toBe("x402");
		expect(body.uptime).toBeGreaterThan(0);
	});
});
