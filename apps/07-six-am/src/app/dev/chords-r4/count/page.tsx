import { notFound } from "next/navigation";
import { Counter } from "./counter";

// Dev only: counts the visible words of a chords prototype (r3 vs r4) in a 1280 × 800 or phone frame.
export default async function Page(props: PageProps<"/dev/chords-r4/count">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  const one = (x: string | string[] | undefined) => (Array.isArray(x) ? x[0] : x) ?? "";
  return <Counter src={one(q.src)} w={Number(one(q.w)) || 1280} h={Number(one(q.h)) || 800} />;
}
