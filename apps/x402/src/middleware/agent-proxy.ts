import type { Context, MiddlewareHandler } from "hono";
import { signAgentRequest } from "../utils/proxy-signature.js";

type ProxyOptions = {
	upstreamPath: string;
	method?: "GET" | "POST" | "PUT" | "PATCH";
	buildPayload: (c: Context) => unknown | Promise<unknown>;
	buildUpstreamPath?: (c: Context) => string | Promise<string>;
};

function getRequiredEnv(name: string): string | null {
	const value = process.env[name]?.trim();
	return value ? value : null;
}

function buildUpstreamUrl(baseUrl: string, path: string): string {
	return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

export function createSignedAgentProxy(options: ProxyOptions): MiddlewareHandler {
	const method = options.method ?? "POST";

	return async (c) => {
		try {
			const rustApiBaseUrl = getRequiredEnv("RUST_API_BASE_URL");
			const agentProxyKeyId = getRequiredEnv("AGENT_PROXY_KEY_ID");
			const agentProxySecret = getRequiredEnv("AGENT_PROXY_SECRET");

			if (!rustApiBaseUrl || !agentProxyKeyId || !agentProxySecret) {
				console.error("[agent-proxy] missing required env vars");
				return c.json({ message: "proxy misconfigured" }, 500);
			}

			const upstreamPath = options.buildUpstreamPath
				? await options.buildUpstreamPath(c)
				: options.upstreamPath;
			const payload = await options.buildPayload(c);
			const signed = signAgentRequest({
				method,
				path: upstreamPath,
				body: payload,
				keyId: agentProxyKeyId,
				secret: agentProxySecret,
			});
			const shouldSendBody = !["GET"].includes(method);

			const upstream = await fetch(buildUpstreamUrl(rustApiBaseUrl, upstreamPath), {
				method,
				headers: signed.headers,
				...(shouldSendBody ? { body: signed.bodyBytes } : {}),
			});

			const text = await upstream.text();
			const contentType = upstream.headers.get("content-type") ?? "application/json";
			return new Response(text, {
				status: upstream.status,
				headers: {
					"content-type": contentType,
				},
			});
		} catch (error) {
			console.error("[agent-proxy] proxy failed", error);
			return c.json({ message: "proxy failed" }, 500);
		}
	};
}
