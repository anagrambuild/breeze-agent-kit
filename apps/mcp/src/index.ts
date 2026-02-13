import { createServer } from "node:http";

const port = Number(process.env.PORT ?? "3500");
const host = process.env.HOST ?? "0.0.0.0";

const server = createServer((req, res) => {
	if (req.url === "/healthz") {
		res.writeHead(200, { "content-type": "application/json" });
		res.end(
			JSON.stringify({
				status: "ok",
				service: "mcp",
				version: "0.0.1",
			}),
		);
		return;
	}

	res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
	res.end("mcp placeholder server");
});

server.listen(port, host, () => {
	console.log(`mcp server listening on http://${host}:${port}`);
});
