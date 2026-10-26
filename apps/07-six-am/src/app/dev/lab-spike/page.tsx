import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabSpike } from "./spike";

// Lab spike (L144), dev only: tab capture of the Deck window with local playback suppressed,
// rolling htdemucs separation in the browser, solo/mute per part, and a bench on Six AM's own
// synthetic mix (speed and separation quality with known parts). Not a product screen.
export const metadata: Metadata = { title: "Six AM · Lab spike" };

export default async function Page(props: PageProps<"/dev/lab-spike">) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return <LabSpike url={one(q.url) ?? ""} hop={Number(one(q.hop) ?? 3)} guard={Number(one(q.guard) ?? 0.5)} auto={one(q.auto) ?? ""} />;
}
