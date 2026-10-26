import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lab, type View } from "./lab";

// Combined Lab prototype (dev only, L162): Listen with notes on the timeline + the Make room, one
// switch. ?mode=listen|make · ?state=first|loading|catching|empty · ?data=worst · ?clean=1 hides
// the dev overlay for screenshots.
export const metadata: Metadata = { title: "Six AM · Lab" };

const VIEWS: View[] = ["first", "loading", "catching", "empty"];

export default async function Page(props: PageProps<"/dev/lab-combined">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  const view = VIEWS.find((v) => v === q.state) ?? "main";
  return <Lab mode={q.mode === "make" ? "make" : "listen"} view={view} worst={q.data === "worst"} clean={q.clean === "1"} />;
}
