import { app } from "./app.js";
import { serve } from "@hono/node-server";

const port = Number(process.env.PORT) || 3402;

console.log(`x402 running on http://localhost:${port}!`);

serve({
	fetch: app.fetch,
	port,
});
