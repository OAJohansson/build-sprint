import type { Metadata } from "next";
import { Setup } from "./setup";

// Throwaway: the Mentor's first-run setup, question step (design session, 24 Oct).
export const metadata: Metadata = { title: "Six AM · Mentor setup prototype" };
export default function Page() { return <Setup />; }
