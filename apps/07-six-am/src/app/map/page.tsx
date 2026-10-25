import type { Metadata } from "next";
import { MapView } from "@/components/map/map-view";

// The arrangement map of one track: /map?id=<analysis id (its SoundCloud URL)>. Graders:
// ?url=<track>&auto=1 starts the full-track listen at once. The title stays fixed: Chrome's
// --auto-select-tab-capture-source-by-title matches it.
export const metadata: Metadata = { title: "Six AM Map" };

export default async function Page(props: PageProps<"/map">) {
  const { id, url, auto } = await props.searchParams;
  const track = typeof id === "string" && id ? id : typeof url === "string" ? url : "";
  return <MapView id={track} auto={auto === "1"} />;
}
