export enum X402Endpoint {
	Deposit = "/deposit",
	Withdraw = "/withdraw",
	Balance = "/balance",
}

export type PaymentResponseHeader = {
	x402Version?: number;
	success?: boolean;
	transaction?: string;
	network?: string;
};

export type AgentTxPayload = {
	amount: number;
	user_key: string;
	payer_key?: string;
	strategy_id: string;
	base_asset: string;
	all?: boolean;
	user_token_account?: string;
};
