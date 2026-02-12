import { Hono } from "hono";
import { logger } from "hono/logger";
import { deposit } from "./routes/deposit.js";
import { withdraw } from "./routes/withdraw.js";

export const app = new Hono();

app.use(logger());

app.route("/deposit", deposit);
app.route("/withdraw", withdraw);

app.get("/", (c) => c.json({ name: "x402", status: "ok" }));
