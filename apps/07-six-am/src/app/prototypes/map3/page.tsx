import type { Metadata } from "next";
import { TRACKS, type TrackId } from "./data";
import { StudioMap, type MapState } from "./studio-map";

// Arrangement map, round 2: the owner's pick (L114), direction 1 "Studio", built out. Isolated:
// nothing in production imports it. ?state=main|listening|empty, &mentor=1, &track=demo|long|edit|three|title.
export const metadata: Metadata = { title: "Six AM · Map" };

export default async function Page(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await props.searchParams;
  const id = (q.track && q.track in TRACKS ? q.track : "demo") as TrackId;
  const state = (["main", "listening", "empty"].includes(q.state ?? "") ? q.state : "main") as MapState;
  return <StudioMap key={`${id}-${state}`} track={TRACKS[id]} initialState={state} initialMentor={q.mentor === "1"} />;
}
