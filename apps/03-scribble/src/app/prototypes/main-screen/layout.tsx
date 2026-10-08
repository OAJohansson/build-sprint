import { Courier_Prime, EB_Garamond, Newsreader } from "next/font/google";
import "./prototype.css";

// Prototype surface only (prototype skill, Phase 4). Nothing in production imports from here.
const garamond = EB_Garamond({ variable: "--font-garamond", subsets: ["latin"], style: ["normal", "italic"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });
const courier = Courier_Prime({ variable: "--font-courier", subsets: ["latin"], weight: ["400", "700"] });

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${garamond.variable} ${newsreader.variable} ${courier.variable}`}>{children}</div>;
}
