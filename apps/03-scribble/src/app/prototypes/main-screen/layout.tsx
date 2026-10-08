import { Courier_Prime, Cutive_Mono, Special_Elite } from "next/font/google";
import "./prototype.css";

// Prototype surface only (prototype skill, Phase 4). Nothing in production imports from here.
const courier = Courier_Prime({ variable: "--font-courier", subsets: ["latin"], weight: ["400", "700"] });
const elite = Special_Elite({ variable: "--font-elite", subsets: ["latin"], weight: "400" });
const cutive = Cutive_Mono({ variable: "--font-cutive", subsets: ["latin"], weight: "400" });

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${courier.variable} ${elite.variable} ${cutive.variable}`}>{children}</div>;
}
