// app/layout.tsx
// Root layout — light "Warm Craft" theme. Inter up to 800 for bold headings.
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileApp } from "@/components/layout/MobileApp";

export const metadata: Metadata = {
  title: "PocketCampus",
  description: "Track your expenses, manage monthly budgets and add expenses by voice in Pakistani Rupees.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PocketCampus",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5E6CC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="PocketCampus" />
      </head>
      <body className="min-h-screen bg-bg-base text-ink"><MobileApp />{children}</body>
    </html>
  );
}
