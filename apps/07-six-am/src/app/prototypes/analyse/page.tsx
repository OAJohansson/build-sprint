import type { Metadata } from "next";
import { Harness } from "./harness";

// shortcut: prototype surface for the Analyse view design session (Ears v1). Delete it once a
// direction is promoted (prototype skill, Hard Rule 5). Nothing in production imports from here.
export const metadata: Metadata = { title: "Six AM · Analyse prototypes", robots: { index: false } };

export default async function Page(props: PageProps<"/prototypes/analyse">) {
  const { state } = await props.searchParams;
  const s = state === "empty" || state === "listen" ? state : "main";
  return <Harness state={s} />;
}
