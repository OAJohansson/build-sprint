import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mallow",
  description: "Keep track between appointments, so your doctor sees what really happened.",
};

// Phone baseline (mobile-native skill): content can sit under the notch (pad with
// env(safe-area-inset-*)), the keyboard resizes the layout, and the status bar matches the
// background in both themes. Zoom stays enabled.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  // Mallow is light-only for now, so the status bar matches its paper in both phone themes.
  themeColor: "#fdfbfd",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="mallow min-h-dvh">{children}</body>
    </html>
  );
}
