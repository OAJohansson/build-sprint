import { Barlow_Condensed, Caveat_Brush, Patrick_Hand } from "next/font/google";
import "./themes.css";

// Fonts for the prototype surface only: the board's hand-lettered title, the sketch themes'
// handwritten UI, and the workwear theme's condensed labels.
const hand = Caveat_Brush({ weight: "400", subsets: ["latin"], variable: "--font-hand" });
const pencil = Patrick_Hand({ weight: "400", subsets: ["latin"], variable: "--font-pencil" });
const work = Barlow_Condensed({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-work" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${hand.variable} ${pencil.variable} ${work.variable}`}>{children}</div>;
}
