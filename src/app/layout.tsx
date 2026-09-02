import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plexSansArabic = IBM_Plex_Sans_Arabic({
	variable: "--font-sans-arabic",
	subsets: ["arabic", "latin"],
	weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Mailflare",
	description: "بريد إلكتروني متعدد المستأجرين على Cloudflare",
	icons: { icon: "/api/branding/icon" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="ar" dir="rtl">
			<head>
				<link rel="icon" href="/api/branding/icon"></link>
			</head>
			<body className={`${plexSansArabic.variable} ${geistMono.variable} antialiased light`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
