import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Harness } from "./harness";

// Lab directions round 2 (Phase 4, Discover restart after L152; decision 0028), dev only: ~10 rough prototypes of the Lab
// screen behind the prototype picker. ?v=N picks one; ?clean=1 hides the picker for screenshots.
export const metadata: Metadata = { title: "Six AM · Lab directions 2" };

export default async function Page(props: PageProps<"/dev/lab-directions-2">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  return <Harness clean={q.clean === "1"} />;
}
