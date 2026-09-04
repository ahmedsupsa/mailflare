import type { Metadata, Viewport } from "next";
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
	title: "Mail",
	description: "بريد إلكتروني متعدد المستأجرين على Cloudflare",
	manifest: "/manifest.webmanifest",
	icons: { icon: "/api/branding/icon", apple: "/apple-touch-icon.png" },
	appleWebApp: {
		capable: true,
		title: "Mail",
		statusBarStyle: "black-translucent",
	},
};

export const viewport: Viewport = {
	themeColor: "#171717",
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="ar" dir="rtl">
			<head>
				<link rel="icon" href="/api/branding/icon"></link>
				<meta name="apple-mobile-web-app-capable" content="yes" />
			</head>
			<body className={`${plexSansArabic.variable} ${geistMono.variable} antialiased light`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
