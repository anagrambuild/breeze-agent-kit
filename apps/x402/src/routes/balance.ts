import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { createSignedAgentProxy } from "../middleware/agent-proxy";

const balanceParams = z.object({
	fund_user: z.string().min(1),
});

export const balance = new Hono();

balance.get(
	"/:fund_user",
	zValidator("param", balanceParams),
	createSignedAgentProxy({
		method: "GET",
		upstreamPath: "/agent/balance",
		buildUpstreamPath: async (c) => {
			const fund_user = c.req.param("fund_user");
			return `/agent/balance/${encodeURIComponent(fund_user)}`;
		},
		buildPayload: async () => undefined,
	}),
);
