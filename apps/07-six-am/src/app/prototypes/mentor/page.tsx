import type { Metadata } from "next";
import { Harness } from "./harness";
import type { Preset } from "./use-mentor";

// Throwaway design prototypes for the Mentor panel (design session, 24 Oct). Nothing in production
// imports this folder. ?v=1..3 picks the direction, ?s= explain | listen | general | warn | empty | jobs.
export const metadata: Metadata = { title: "Six AM · Mentor prototypes" };

export default async function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { s, v } = await props.searchParams;
  const preset = (typeof s === "string" ? s : "explain") as Preset;
  return <Harness preset={preset} v={(parseInt(typeof v === "string" ? v : "1", 10) || 1) - 1} />;
}
