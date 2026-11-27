import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Harness } from "./harness";

// Chords directions (Phase 6, decision 0028), dev only: ~10 rough directions for Make → Melody behind
// the prototype picker. ?v=N picks one; ?s=key opens its key state; ?clean=1 hides the picker.
export const metadata: Metadata = { title: "Six AM · Chords directions" };

export default async function Page(props: PageProps<"/dev/chords-directions">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  const one = (x: string | string[] | undefined) => (Array.isArray(x) ? x[0] : x);
  return <Harness clean={one(q.clean) === "1"} st={one(q.s) === "key" ? "key" : one(q.s) === "worst" ? "worst" : "main"} />;
}
