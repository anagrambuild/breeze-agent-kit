import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/constants";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const mono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const description = "Solana yield strategies for AI agents. MCP + x402.";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: "Breeze Agent Kit",
	description,
	keywords: [
		"Solana",
		"yield",
		"DeFi",
		"MCP",
		"x402",
		"AI agent",
		"staking",
		"USDC",
		"SOL",
		"JitoSOL",
		"Model Context Protocol",
	],
	openGraph: {
		title: "Breeze Agent Kit",
		description,
		url: SITE_URL,
		siteName: "Breeze Agent Kit",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Breeze Agent Kit",
		description,
	},
	alternates: {
		canonical: SITE_URL,
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={mono.variable}>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
