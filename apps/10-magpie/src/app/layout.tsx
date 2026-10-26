import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-sw";
import "./globals.css";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Magpie",
  description: "A sticker book of the food and drink you loved, kept by Maggie the magpie.",
  appleWebApp: { capable: true, title: "Magpie", statusBarStyle: "default" },
};

// Phone baseline (mobile-native skill): content can sit under the notch (pad with
// env(safe-area-inset-*)), the keyboard resizes the layout, and the status bar matches the cream
// paper. Zoom stays enabled.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#fff4e0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fredoka.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
