import type { Metadata, Viewport } from "next";
import { Courier_Prime } from "next/font/google";
import "./globals.css";
import "./scribble.css";

const courier = Courier_Prime({ variable: "--font-type", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Scribble",
  description: "A few sentences a day, and a reader who tells you what worked.",
};

// Phone baseline (mobile-native skill): content can sit under the notch (pad with
// env(safe-area-inset-*)), the keyboard resizes the layout, and the status bar matches the
// background in both themes (Manuscript by day, Night by night). Zoom stays enabled.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efe6d3" },
    { media: "(prefers-color-scheme: dark)", color: "#15110d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${courier.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
