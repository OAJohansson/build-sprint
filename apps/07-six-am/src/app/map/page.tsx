import type { Metadata } from "next";
import { MapView } from "@/components/map/map-view";

// One track's Lab (S1): /map?id=<analysis id (its SoundCloud URL)>; ?quiet=1 silences the parts
// (graders). A track without a map gets the Phase 3 listen first. Graders:
// ?url=<track>&auto=1 starts the full-track listen at once. The title stays fixed: Chrome's
// --auto-select-tab-capture-source-by-title matches it.
export const metadata: Metadata = { title: "Six AM Map" };

export default async function Page(props: PageProps<"/map">) {
  const { id, url, auto, quiet } = await props.searchParams;
  const track = typeof id === "string" && id ? id : typeof url === "string" ? url : "";
  return <MapView id={track} auto={auto === "1"} quiet={quiet === "1"} />;
}
