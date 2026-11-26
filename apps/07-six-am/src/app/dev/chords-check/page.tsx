import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChordsCheck } from "./check";

// Phase 6 spike check, dev only: Make's own worker reads Six AM's own synthetic chord parts (never a
// streamed original) with chord reader A and B, B three times in a row (BP-1: every read must say
// "basic-pitch"), and prints the reader, the time and the chords. Not a product screen; real-track
// grading runs on the Lab's window.__sixamLab.chordsRead.
export const metadata: Metadata = { title: "Six AM · chord reader check" };

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ChordsCheck />;
}
