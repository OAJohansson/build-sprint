import { NewHabit } from "@/components/new-habit";
import type { Metadata } from "next";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.app.titles.newStop };

// Create a stop habit (R3).
export default function Page() {
  return <NewHabit kind="stop" />;
}
