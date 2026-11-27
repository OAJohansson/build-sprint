import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Fraunces with its optical-size axis: the focused school is set at opsz 144 (handoff "Type").
// Italic too: the skeleton sets its big question and idea summaries in Fraunces italic (P7).
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meander",
  description: "Wander through whole fields of knowledge: philosophy and music, as a map of connected ideas.",
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
