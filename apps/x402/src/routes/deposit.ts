import { Hono } from "hono";

export const deposit = new Hono();

deposit.post("/", async (c) => {
	const body = await c.req.json();

	console.log("[deposit] received:", body);

	// TODO: real deposit logic
	const result = {
		id: crypto.randomUUID(),
		type: "deposit",
		amount: body.amount,
		asset: body.asset ?? "USDC",
		status: "pending",
		timestamp: new Date().toISOString(),
	};

	console.log("[deposit] created:", result);

	return c.json(result, 201);
});
