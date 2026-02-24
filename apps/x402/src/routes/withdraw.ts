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
	user_token_account: z.string().min(1).optional(),
	create_wsol_ata: z.boolean().optional(),
	unwrap_wsol_ata: z.boolean().optional(),
	detect_wsol_ata: z.boolean().optional(),
	exclude_fees: z.boolean().optional(),
});

withdraw.post(
	"/",
	zValidator("json", withdrawInput),
	createSignedAgentProxy({
		upstreamPath: "/agent/withdraw/tx",
		buildPayload: async (c) => {
			const body = (await c.req.json()) as z.infer<typeof withdrawInput>;
			const params: Record<string, unknown> = {
				user_key: body.user_key,
				payer_key: body.payer_key,
				strategy_id: body.strategy_id,
				base_asset: body.base_asset,
				amount: body.amount,
				all: body.all ?? false,
			};
			if (body.user_token_account !== undefined) params.user_token_account = body.user_token_account;
			if (body.create_wsol_ata !== undefined) params.create_wsol_ata = body.create_wsol_ata;
			if (body.unwrap_wsol_ata !== undefined) params.unwrap_wsol_ata = body.unwrap_wsol_ata;
			if (body.detect_wsol_ata !== undefined) params.detect_wsol_ata = body.detect_wsol_ata;
			if (body.exclude_fees !== undefined) params.exclude_fees = body.exclude_fees;
			return { params };
		},
	}),
);
