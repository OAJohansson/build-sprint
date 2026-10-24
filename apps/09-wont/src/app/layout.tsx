import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { copy } from "@/lib/copy";
import "./globals.css";
import "./wont.css";

// The board's typeface (from the prototypes), on every screen.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-wb" });

export const metadata: Metadata = {
  title: copy.app.name,
  description: copy.app.description,
  applicationName: copy.app.name,
  appleWebApp: { capable: true, title: copy.app.name, statusBarStyle: "default" },
  // The mark: Dough on ink (design/mark-sheet.html #01).
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

// Phone baseline (mobile-native skill): content can sit under the notch (pad with
// env(safe-area-inset-*)), the keyboard resizes the layout, and the status bar matches the cream
// board (L25: no dark band). Zoom stays enabled. Wont has one light theme.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f2ebde",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
