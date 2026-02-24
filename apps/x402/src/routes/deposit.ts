import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { createSignedAgentProxy } from "../middleware/agent-proxy";

const depositInput = z.object({
	user_key: z.string().min(1),
	payer_key: z.string().min(1).optional(),
	strategy_id: z.string().min(1),
	base_asset: z.string().min(1),
	amount: z.number().positive(),
	user_token_account: z.string().min(1).optional(),
});

export const deposit = new Hono();

deposit.post(
	"/",
	zValidator("json", depositInput),
	createSignedAgentProxy({
		upstreamPath: "/agent/deposit/tx",
		buildPayload: async (c) => {
			const body = (await c.req.json()) as z.infer<typeof depositInput>;
			return {
				params: {
					user_key: body.user_key,
					payer_key: body.payer_key,
					strategy_id: body.strategy_id,
					base_asset: body.base_asset,
					amount: body.amount,
					user_token_account: body.user_token_account,
				},
			};
		},
	}),
);
