import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/constants";
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
		images: [{ url: "/og.png", width: 1200, height: 630, alt: "Breeze Agent Kit" }],
	},
	twitter: {
		card: "summary_large_image",
		title: "Breeze Agent Kit",
		description,
		images: ["/og.png"],
	},
	alternates: {
		canonical: SITE_URL,
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={mono.variable}>{children}</body>
		</html>
	);
}
