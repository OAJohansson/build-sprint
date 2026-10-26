import { Intro } from "@/components/intro";
import type { Metadata } from "next";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.app.titles.intro };

// First-launch intro (R1); the board sends a fresh install here, and its footer replays it.
export default function Page() {
  return <Intro />;
}
