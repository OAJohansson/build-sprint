import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { View } from "./view";

// Chords round 3 (Phase 6, L261), dev only: Ear with the keys one tap away and "All N bars".
// ?s=main|fix|keys|timing|lead|worst picks the state.
export const metadata: Metadata = { title: "Six AM · Chords round 3" };

const STATES = ["main", "fix", "keys", "timing", "lead", "worst"] as const;

export default async function Page(props: PageProps<"/dev/chords-r3">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  const s = Array.isArray(q.s) ? q.s[0] : q.s;
  return <View st={STATES.find((x) => x === s) ?? "main"} />;
}
