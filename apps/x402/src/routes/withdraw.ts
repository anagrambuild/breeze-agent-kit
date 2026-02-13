import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { createSignedAgentProxy } from "../middleware/agent-proxy";

export const withdraw = new Hono();

const withdrawInput = z.object({
	user_key: z.string().min(1),
	payer_key: z.string().min(1).optional(),
	strategy_id: z.string().min(1),
	base_asset: z.string().min(1),
	amount: z.number().positive(),
	all: z.boolean().optional(),
});

withdraw.post(
	"/",
	zValidator("json", withdrawInput),
	createSignedAgentProxy({
		upstreamPath: "/agent/withdraw/tx",
		buildPayload: async (c) => {
			const body = (await c.req.json()) as z.infer<typeof withdrawInput>;
			return {
				params: {
					user_key: body.user_key,
					payer_key: body.payer_key,
					strategy_id: body.strategy_id,
					base_asset: body.base_asset,
					amount: body.amount,
					all: body.all ?? false,
				},
			};
		},
	}),
);
