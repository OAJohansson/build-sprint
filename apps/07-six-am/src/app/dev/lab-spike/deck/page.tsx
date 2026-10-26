import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Deck } from "./deck";

// Lab spike (L144): the SoundCloud player in its own small window, so tab capture can silence it
// locally (suppressLocalAudioPlayback mutes the whole captured tab) while the Lab tab plays only the
// separated part. The title stays fixed: Chrome's --auto-select-tab-capture-source-by-title matches it.
export const metadata: Metadata = { title: "Six AM Deck" };

export default async function Page(props: PageProps<"/dev/lab-spike/deck">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { url, auto } = await props.searchParams;
  return <Deck url={typeof url === "string" ? url : ""} auto={auto === "1"} />;
}
