import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SynthRenderCheck } from "./render-check";

// Dev-only grader page (eval X3): renders every synth preset × pattern and both kits offline at a
// key and tempo, and reports the samples and expected events for data-evals to measure. Not a
// product screen; 404 outside `next dev`.
export const metadata: Metadata = { title: "Six AM · Synth render check" };

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await searchParams;
  return (
    <SynthRenderCheck
      keyName={one(q.key) ?? "A"}
      scale={one(q.scale) === "major" ? "major" : "minor"}
      bpm={Number(one(q.bpm) ?? 124)}
      repeats={Number(one(q.repeats) ?? 2)}
      only={one(q.only) ?? ""}
      autorun={one(q.run) !== "0"}
    />
  );
}
