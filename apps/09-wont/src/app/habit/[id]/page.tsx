import { HabitDetail } from "@/components/habit-detail";
import type { Metadata } from "next";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.app.titles.habit };

// One habit: re-log today or yesterday, history, edit wording, delete (R9). Habits live in
// localStorage, so the page only passes the id on and the client looks it up.
export default async function Page(props: PageProps<"/habit/[id]">) {
  const { id } = await props.params;
  return <HabitDetail id={decodeURIComponent(id)} />;
}
