import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Breeze Agent Kit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					padding: "80px",
					background: "#0a0a0a",
					fontFamily: "monospace",
				}}
			>
				{/* Top accent line */}
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						height: "4px",
						background: "linear-gradient(90deg, #e357d5, #e357d5 40%, #333 40%)",
					}}
				/>

				{/* Title */}
				<div
					style={{
						fontSize: 64,
						fontWeight: 700,
						color: "#e0e0e0",
						letterSpacing: "-0.02em",
						lineHeight: 1.1,
					}}
				>
					Breeze Agent Kit
				</div>

				{/* Subtitle */}
				<div
					style={{
						fontSize: 24,
						color: "#666",
						marginTop: "20px",
						lineHeight: 1.5,
					}}
				>
					Solana yield strategies for AI agents
				</div>

				{/* Tags */}
				<div
					style={{
						display: "flex",
						gap: "12px",
						marginTop: "40px",
					}}
				>
					{["MCP", "x402", "Skill", "ClawHub"].map((tag) => (
						<div
							key={tag}
							style={{
								fontSize: 18,
								color: "#e357d5",
								border: "1px solid #333",
								padding: "6px 16px",
								borderRadius: "2px",
							}}
						>
							{tag}
						</div>
					))}
				</div>

				{/* Tokens row */}
				<div
					style={{
						display: "flex",
						gap: "20px",
						marginTop: "48px",
						fontSize: 16,
						color: "#444",
					}}
				>
					{["USDC", "SOL", "JitoSOL", "mSOL", "JupSOL", "USDT", "USDS", "JLP"].map(
						(token) => (
							<div key={token}>{token}</div>
						),
					)}
				</div>

				{/* Bottom domain */}
				<div
					style={{
						position: "absolute",
						bottom: "40px",
						right: "80px",
						fontSize: 18,
						color: "#444",
					}}
				>
					agent.breeze.baby
				</div>
			</div>
		),
		{ ...size },
	);
}
