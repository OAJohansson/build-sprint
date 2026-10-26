import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lab } from "./lab";

// Combined Lab prototype (dev only): direction 5's Listen (notes on the timeline) + direction 3's
// Make room, one Listen/Make switch. ?mode=listen|make; ?clean=1 hides the dev overlay for screenshots.
export const metadata: Metadata = { title: "Six AM · Lab combined" };

export default async function Page(props: PageProps<"/dev/lab-combined">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  return <Lab initial={q.mode === "make" ? "make" : "listen"} clean={q.clean === "1"} />;
}
