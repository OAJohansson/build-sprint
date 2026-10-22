import { Caveat_Brush } from "next/font/google";

// The hand-lettered title font for the board's title pill, only on the prototype surface.
const hand = Caveat_Brush({ weight: "400", subsets: ["latin"], variable: "--font-hand" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={hand.variable}>{children}</div>;
}
