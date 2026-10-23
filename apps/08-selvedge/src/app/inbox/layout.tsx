import { Caveat_Brush, Patrick_Hand } from "next/font/google";
import "@/components/board/sketchbook.css";
import "./inbox.css";

// The inbox wears the board's sketchbook look (Sketchbook V1, locked 22 Oct): the same fonts.
const hand = Caveat_Brush({ weight: "400", subsets: ["latin"], variable: "--font-hand" });
const pencil = Patrick_Hand({ weight: "400", subsets: ["latin"], variable: "--font-pencil" });

export const metadata = { title: "Inbox · Selvedge" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${hand.variable} ${pencil.variable}`}>{children}</div>;
}
