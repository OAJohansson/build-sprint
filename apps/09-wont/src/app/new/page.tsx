import { NewHabit } from "@/components/new-habit";
import type { Metadata } from "next";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.app.titles.newBuild };

// Create a build habit (R2).
export default function Page() {
  return <NewHabit kind="build" />;
}
