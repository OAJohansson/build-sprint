import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Harness } from "./harness";

// Chords round 1 (Phase 6, L260), dev only: Palette, Keyboard, Ear. ?v=N picks one; ?s=fix (a bar being
// fixed) or ?s=notes (a chord's notes edited, Lead row live); ?clean=1 hides the picker.
export const metadata: Metadata = { title: "Six AM · Chords round 1" };

export default async function Page(props: PageProps<"/dev/chords-r1">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  const one = (x: string | string[] | undefined) => (Array.isArray(x) ? x[0] : x);
  const s = one(q.s);
  return <Harness clean={one(q.clean) === "1"} st={s === "fix" || s === "notes" || s === "worst" ? s : "main"} />;
}
