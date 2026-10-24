import type { Metadata } from "next";
import { DemoAnalyse, LiveAnalyse } from "@/components/analyse/analyse-view";

// Ears v1: the Analyse view, alongside the Studio. Needs no server and no access code: results
// live in this browser. ?demo=1 shows sample rows (&listening=off for the off state).
export const metadata: Metadata = { title: "Six AM · Analyse" };

export default async function Page(props: PageProps<"/analyse">) {
  const { demo, listening } = await props.searchParams;
  if (demo === "1") return <DemoAnalyse listening={listening !== "off"} />;
  return <LiveAnalyse />;
}
