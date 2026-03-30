const DEFAULT_BASE_URL = "https://api.breeze.baby";

function getConfig() {
	const baseUrl = (process.env.BREEZE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
	const apiKey = process.env.BREEZE_API_KEY?.trim();
	if (!apiKey) throw new Error("BREEZE_API_KEY is required");
	return { baseUrl, apiKey };
}

type ProxyOptions = {
	method: "GET" | "POST";
	path: string;
	body?: unknown;
	query?: Record<string, string | undefined>;
};

export async function breezeProxy(opts: ProxyOptions): Promise<Response> {
	const { baseUrl, apiKey } = getConfig();

	const url = new URL(`${baseUrl}${opts.path}`);
	if (opts.query) {
		for (const [key, value] of Object.entries(opts.query)) {
			if (value !== undefined) url.searchParams.set(key, value);
		}
	}

	const headers: Record<string, string> = {
		"x-api-key": apiKey,
	};
	if (opts.method === "POST") {
		headers["content-type"] = "application/json";
	}

	const response = await fetch(url.toString(), {
		method: opts.method,
		headers,
		...(opts.method === "POST" && opts.body ? { body: JSON.stringify(opts.body) } : {}),
	});

	const text = await response.text();
	const contentType = response.headers.get("content-type") ?? "application/json";
	return new Response(text, {
		status: response.status,
		headers: { "content-type": contentType },
	});
}
