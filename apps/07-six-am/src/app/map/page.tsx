import type { Metadata } from "next";
import { MapDebug } from "@/components/map/map-debug";

// Phase 3 S1/S2, non-visual: the arrangement map's debug surface. ?url=<SoundCloud track>&auto=1
// starts the full-track listen as soon as the player is ready (graders; see MapDebug).
// The title stays fixed: Chrome's --auto-select-tab-capture-source-by-title matches it.
export const metadata: Metadata = { title: "Six AM Map" };

export default async function Page(props: PageProps<"/map">) {
  const { url, auto } = await props.searchParams;
  return <MapDebug initialUrl={typeof url === "string" ? url : ""} auto={auto === "1"} />;
}
