import { Hono } from "hono";
import { logger } from "hono/logger";
import { x402PaymentWall } from "./middleware/x402.js";
import { balance } from "./routes/balance.js";
import { deposit } from "./routes/deposit.js";
import { withdraw } from "./routes/withdraw.js";

export const app = new Hono();

app.use(logger());

// root info page — no payment required
app.get("/", (c) => {
	const markdown = `# Breeze x402 API

Payment-gated Solana yield strategy endpoints powered by the [x402 protocol](https://x402.org).

## Endpoints

| Method | Path                   | Auth | Description                          |
|--------|------------------------|------|--------------------------------------|
| GET    | /healthz               | -    | Service health check                 |
| GET    | /balance/:fund_user    | x402 | Wallet positions, yield earned, APY  |
| POST   | /deposit               | x402 | Build unsigned deposit transaction   |
| POST   | /withdraw              | x402 | Build unsigned withdraw transaction  |

## Auth

Protected endpoints require a USDC micropayment via the x402 protocol.
Use @faremeter/fetch to handle payment challenges automatically.

## Links

- https://agent.breeze.baby
- https://breeze.baby
- https://github.com/anagrambuild/breeze-agent-kit

---

Built for agents, with <3
`;

	return c.text(markdown, 200, { "content-type": "text/markdown; charset=utf-8" });
});

// healthz is free — no payment required
app.get("/healthz", (c) =>
	c.json({
		status: "ok",
		service: "x402",
		version: "0.0.1",
		uptime: process.uptime(),
	}),
);

// paid endpoints — x402 payment wall
app.use("/deposit/*", x402PaymentWall);
app.use("/withdraw/*", x402PaymentWall);
app.use("/balance/*", x402PaymentWall);

app.route("/balance", balance);
app.route("/deposit", deposit);
app.route("/withdraw", withdraw);
