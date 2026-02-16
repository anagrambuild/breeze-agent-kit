import {
	AGENT_PAYER_KEY,
	AGENT_USER_KEY_ENV,
	BALANCE_FUND_USER_ENV,
	BASE_ASSET,
	DEPOSIT_AMOUNT,
	STRATEGY_ID,
	WITHDRAW_ALL,
	WITHDRAW_AMOUNT,
	apiBaseUrl,
	firstDefined,
} from "./env.js";
import { keypair } from "./client.js";
import { AgentTxPayload, X402Endpoint } from "./types.js";

const AGENT_USER_KEY = AGENT_USER_KEY_ENV ?? keypair.publicKey.toBase58();
const BALANCE_FUND_USER = firstDefined(BALANCE_FUND_USER_ENV, AGENT_USER_KEY)!;

function payloadFor(endpoint: X402Endpoint): AgentTxPayload {
	if (endpoint === X402Endpoint.Deposit) {
		return {
			amount: DEPOSIT_AMOUNT,
			user_key: AGENT_USER_KEY,
			payer_key: AGENT_PAYER_KEY,
			strategy_id: STRATEGY_ID,
			base_asset: BASE_ASSET,
		};
	}

	return {
		amount: WITHDRAW_AMOUNT,
		user_key: AGENT_USER_KEY,
		payer_key: AGENT_PAYER_KEY,
		strategy_id: STRATEGY_ID,
		base_asset: BASE_ASSET,
		all: WITHDRAW_ALL,
	};
}

function requestFor(endpoint: X402Endpoint): {
	endpointUrl: string;
	init: RequestInit;
	payloadForLog?: string;
} {
	if (endpoint === X402Endpoint.Balance) {
		const endpointUrl = `${apiBaseUrl}${endpoint}/${encodeURIComponent(BALANCE_FUND_USER)}`;
		return {
			endpointUrl,
			init: { method: "GET" },
		};
	}

	const payload = payloadFor(endpoint);
	return {
		endpointUrl: `${apiBaseUrl}${endpoint}`,
		init: {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
		},
		payloadForLog: JSON.stringify(payload),
	};
}

export { requestFor };
