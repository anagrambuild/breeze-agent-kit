import { app } from "./app.js";
import { serve } from "@hono/node-server";

const port = Number(process.env.PORT) || 3403;

console.log(`mpp running on http://localhost:${port}!`);

serve({
	fetch: app.fetch,
	port,
});
