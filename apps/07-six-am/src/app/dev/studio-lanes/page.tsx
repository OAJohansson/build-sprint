import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Harness } from "./harness";

// Studio lane directions (S5, L159, L193), dev only: 3 rough directions behind the prototype picker.
// ?v=N picks one; ?s=main|add|drop sets the state; ?data=worst the break-ui data; ?clean=1 hides the picker.
export const metadata: Metadata = { title: "Six AM · Studio lanes" };

export default async function Page(props: PageProps<"/dev/studio-lanes">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  const one = (x: string | string[] | undefined) => (Array.isArray(x) ? x[0] : x);
  return <Harness clean={one(q.clean) === "1"} state={one(q.s) ?? "main"} worst={one(q.data) === "worst"} />;
}
