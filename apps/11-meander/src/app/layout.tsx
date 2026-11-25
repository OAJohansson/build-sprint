import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Fraunces with its optical-size axis: the focused school is set at opsz 144 (handoff "Type").
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meander",
  description: "The whole of Western philosophy on one globe: see where a school sits, what it built on, and where to go next.",
};

// Phone baseline (mobile-native skill): content can sit under the notch (padded with
// env(safe-area-inset-*)), and the status bar matches the ground colour. Zoom stays enabled.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101918",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}
