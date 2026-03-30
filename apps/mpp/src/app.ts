import { Hono } from "hono";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { mppPaymentWall } from "./middleware/mpp.js";
import { breezeProxy } from "./lib/breeze-proxy.js";

const DEFAULT_STRATEGY_ID = "43620ba3-354c-456b-aa3c-5bf7fa46a6d4";

export const app = new Hono();

app.use(logger());

// ── Free endpoints ──────────────────────────────────────────────────────────

app.get("/", (c) => {
	const markdown = `# Breeze MPP API

Payment-gated Solana yield strategy endpoints powered by the [Model Payment Protocol](https://github.com/solana-foundation/mpp-sdk).

## Endpoints

| Method | Path                              | Auth | Description                           |
|--------|-----------------------------------|------|---------------------------------------|
| GET    | /healthz                          | -    | Service health check                  |
| GET    | /strategy-info/:strategy_id?      | MPP  | Strategy metadata and APY             |
| GET    | /breeze-balances/:user_pubkey     | MPP  | Wallet positions, deposits, yield     |
| GET    | /user-balances/:user_id           | MPP  | User balance info                     |
| GET    | /user-yield/:user_id              | MPP  | Total yield earned                    |
| POST   | /deposit/tx                       | MPP  | Build unsigned deposit transaction    |
| POST   | /deposit/ix                       | MPP  | Raw deposit instructions              |
| POST   | /withdraw/tx                      | MPP  | Build unsigned withdraw transaction   |
| POST   | /withdraw/ix                      | MPP  | Raw withdraw instructions             |
| POST   | /close-user-account/tx            | MPP  | Close account transaction             |
| POST   | /close-user-account/ix            | MPP  | Close account instructions            |

## Auth

Protected endpoints require a USDC micropayment (0.001 USDC) via the MPP protocol.
Use @solana/mpp/client to handle payment challenges automatically.

## Links

- https://agent.breeze.baby
- https://breeze.baby
- https://github.com/anagrambuild/breeze-agent-kit

---

Built for agents, with <3
`;

	return c.text(markdown, 200, { "content-type": "text/markdown; charset=utf-8" });
});

app.get("/healthz", (c) =>
	c.json({
		status: "ok",
		service: "mpp",
		version: "0.0.1",
		uptime: process.uptime(),
	}),
);

// ── MPP-gated endpoints ─────────────────────────────────────────────────────

app.use("/strategy-info/*", mppPaymentWall);
app.use("/breeze-balances/*", mppPaymentWall);
app.use("/user-balances/*", mppPaymentWall);
app.use("/user-yield/*", mppPaymentWall);
app.use("/deposit/*", mppPaymentWall);
app.use("/withdraw/*", mppPaymentWall);
app.use("/close-user-account/*", mppPaymentWall);

// ── Strategy Info ───────────────────────────────────────────────────────────

app.get("/strategy-info/:strategy_id?", async (c) => {
	const strategyId = c.req.param("strategy_id") || DEFAULT_STRATEGY_ID;
	return breezeProxy({
		method: "GET",
		path: `/strategy-info/${encodeURIComponent(strategyId)}/`,
	});
});

// ── Breeze Balances ─────────────────────────────────────────────────────────

const breezeBalancesParams = z.object({
	user_pubkey: z.string().min(1),
});

app.get("/breeze-balances/:user_pubkey", zValidator("param", breezeBalancesParams), async (c) => {
	const userPubkey = c.req.param("user_pubkey");
	const strategyId = c.req.query("strategy_id") || DEFAULT_STRATEGY_ID;
	return breezeProxy({
		method: "GET",
		path: `/breeze-balances/${encodeURIComponent(userPubkey)}`,
		query: { strategy_id: strategyId },
	});
});

// ── User Balances ───────────────────────────────────────────────────────────

const userIdParams = z.object({
	user_id: z.string().min(1),
});

app.get("/user-balances/:user_id", zValidator("param", userIdParams), async (c) => {
	const userId = c.req.param("user_id");
	return breezeProxy({
		method: "GET",
		path: `/user-balances/${encodeURIComponent(userId)}`,
	});
});

// ── User Yield ──────────────────────────────────────────────────────────────

app.get("/user-yield/:user_id", zValidator("param", userIdParams), async (c) => {
	const userId = c.req.param("user_id");
	return breezeProxy({
		method: "GET",
		path: `/user-yield/${encodeURIComponent(userId)}`,
	});
});

// ── Deposit ─────────────────────────────────────────────────────────────────

const depositInput = z.object({
	user_key: z.string().min(1),
	payer_key: z.string().min(1).optional(),
	strategy_id: z.string().min(1).optional(),
	base_asset: z.string().min(1),
	amount: z.number().positive(),
	user_token_account: z.string().min(1).optional(),
});

app.post("/deposit/tx", zValidator("json", depositInput), async (c) => {
	const body = c.req.valid("json");
	return breezeProxy({
		method: "POST",
		path: "/deposit/tx",
		body: {
			params: {
				...body,
				strategy_id: body.strategy_id || DEFAULT_STRATEGY_ID,
			},
		},
	});
});

app.post("/deposit/ix", zValidator("json", depositInput), async (c) => {
	const body = c.req.valid("json");
	return breezeProxy({
		method: "POST",
		path: "/deposit/ix",
		body: {
			params: {
				...body,
				strategy_id: body.strategy_id || DEFAULT_STRATEGY_ID,
			},
		},
	});
});

// ── Withdraw ────────────────────────────────────────────────────────────────

const withdrawInput = z.object({
	user_key: z.string().min(1),
	payer_key: z.string().min(1).optional(),
	strategy_id: z.string().min(1).optional(),
	base_asset: z.string().min(1),
	amount: z.number().positive(),
	all: z.boolean().optional(),
	user_token_account: z.string().min(1).optional(),
	create_wsol_ata: z.boolean().optional(),
	unwrap_wsol_ata: z.boolean().optional(),
	detect_wsol_ata: z.boolean().optional(),
	exclude_fees: z.boolean().optional(),
});

app.post("/withdraw/tx", zValidator("json", withdrawInput), async (c) => {
	const body = c.req.valid("json");
	return breezeProxy({
		method: "POST",
		path: "/withdraw/tx",
		body: {
			params: {
				...body,
				strategy_id: body.strategy_id || DEFAULT_STRATEGY_ID,
			},
		},
	});
});

app.post("/withdraw/ix", zValidator("json", withdrawInput), async (c) => {
	const body = c.req.valid("json");
	return breezeProxy({
		method: "POST",
		path: "/withdraw/ix",
		body: {
			params: {
				...body,
				strategy_id: body.strategy_id || DEFAULT_STRATEGY_ID,
			},
		},
	});
});

// ── Close User Account ──────────────────────────────────────────────────────

const closeAccountInput = z.object({
	user_key: z.string().min(1),
	payer_key: z.string().min(1).optional(),
	strategy_id: z.string().min(1).optional(),
});

app.post("/close-user-account/tx", zValidator("json", closeAccountInput), async (c) => {
	const body = c.req.valid("json");
	return breezeProxy({
		method: "POST",
		path: "/close-user-account/tx",
		body: {
			params: {
				...body,
				strategy_id: body.strategy_id || DEFAULT_STRATEGY_ID,
			},
		},
	});
});

app.post("/close-user-account/ix", zValidator("json", closeAccountInput), async (c) => {
	const body = c.req.valid("json");
	return breezeProxy({
		method: "POST",
		path: "/close-user-account/ix",
		body: {
			params: {
				...body,
				strategy_id: body.strategy_id || DEFAULT_STRATEGY_ID,
			},
		},
	});
});
