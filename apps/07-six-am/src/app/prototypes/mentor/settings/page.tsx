import type { Metadata } from "next";
import { Settings } from "./settings";

// Throwaway: Settings → "What Six AM has learned about you" (design session, 24 Oct).
export const metadata: Metadata = { title: "Six AM · Settings prototype" };
export default function Page() { return <Settings />; }
