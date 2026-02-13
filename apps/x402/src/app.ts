import { Hono } from "hono";
import { logger } from "hono/logger";
import { x402PaymentWall } from "./middleware/x402.js";
import { balance } from "./routes/balance.js";
import { deposit } from "./routes/deposit.js";
import { withdraw } from "./routes/withdraw.js";

export const app = new Hono();

app.use(logger());

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
