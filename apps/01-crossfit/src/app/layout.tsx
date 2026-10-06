import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600"] });
const condensed = Barlow_Condensed({ variable: "--font-condensed", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "CrossFit Log",
  description: "Your PBs, ready when the coach says 70%. Log class by voice.",
  appleWebApp: { capable: true, title: "CrossFit Log", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#111111", width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${barlow.variable} ${condensed.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
