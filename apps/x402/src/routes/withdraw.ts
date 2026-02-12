import { Hono } from "hono";

export const withdraw = new Hono();

withdraw.post("/", async (c) => {
	const body = await c.req.json();

	console.log("[withdraw] received:", body);

	// TODO: real withdraw logic
	const result = {
		id: crypto.randomUUID(),
		type: "withdraw",
		amount: body.amount,
		asset: body.asset ?? "USDC",
		destination: body.destination,
		status: "pending",
		timestamp: new Date().toISOString(),
	};

	console.log("[withdraw] created:", result);

	return c.json(result, 201);
});
