import type { Metadata } from "next";
import { Deck } from "@/components/lab/deck";
import { DECK_TITLE } from "@/lib/lab/deck-protocol";

// The Deck (L150, L178): SoundCloud plays here, in its own small window, so the Lab can capture this
// tab with its local playback silenced and play only the separated parts. The title stays fixed:
// the Lab's users pick it in Chrome's dialog, and --auto-select-tab-capture-source-by-title matches it.
export const metadata: Metadata = { title: DECK_TITLE };

export default async function Page(props: PageProps<"/deck">) {
  const { url } = await props.searchParams;
  return <Deck url={typeof url === "string" && /^https:\/\/(on\.|m\.)?soundcloud\.com\/\S+$/i.test(url) ? url : ""} />;
}
