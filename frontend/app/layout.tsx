// app/layout.tsx
// Root layout — light "Warm Craft" theme. Inter up to 800 for bold headings.
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileApp } from "@/components/layout/MobileApp";

export const metadata: Metadata = {
  title: { default: "PocketCampus — Your campus life, in your pocket", template: "%s · PocketCampus" },
  description: "Track your expenses, manage monthly budgets and add expenses by voice in Pakistani Rupees.",
  keywords: ["student budget app", "campus expense tracker", "student spending Pakistan", "PKR budget app", "PocketCampus"],
  applicationName: "PocketCampus",
  creator: "PocketCampus",
  openGraph: { title: "PocketCampus — Your campus life, in your pocket", description: "Track expenses, manage monthly budgets and explore useful places around campus.", type: "website", siteName: "PocketCampus", images: [{ url: "/pocketcampus_banner.svg", width: 1200, height: 630, alt: "PocketCampus" }] },
  twitter: { card: "summary_large_image", title: "PocketCampus — Your campus life, in your pocket", description: "A calmer way to manage student spending." },
  manifest: "/manifest.json",
  icons: { icon: "/icons/favicon-v2.ico", apple: "/icons/apple-touch-icon-v2.png" },
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
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="PocketCampus" />
      </head>
      <body className="min-h-screen bg-bg-base text-ink"><MobileApp />{children}</body>
    </html>
  );
}
