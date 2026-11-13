import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BpCheck } from "./check";

// L245 check, dev only: Make's own worker reads a melody (Six AM's own synthetic chord part, never a
// streamed original) with the configured reader, and says which reader ran, how long it took and what
// it read. Proves Basic Pitch's model loads from /models in the browser and times it. Not a product screen.
export const metadata: Metadata = { title: "Six AM · melody reader check" };

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <BpCheck />;
}
