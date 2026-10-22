import { Caveat_Brush, Patrick_Hand } from "next/font/google";
import "@/components/board/sketchbook.css";

// The board editor's fonts: the hand-lettered title pill and the sketchbook's handwritten UI.
const hand = Caveat_Brush({ weight: "400", subsets: ["latin"], variable: "--font-hand" });
const pencil = Patrick_Hand({ weight: "400", subsets: ["latin"], variable: "--font-pencil" });

export const metadata = { title: "Board · Selvedge" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${hand.variable} ${pencil.variable}`}>{children}</div>;
}
