import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareTest } from "./share-test";

// L178 check (dev only): can one click open the Deck window AND ask Chrome to share it?
export const metadata: Metadata = { title: "Six AM · share test" };

export default async function Page(props: PageProps<"/dev/lab-spike/share-test">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { url } = await props.searchParams;
  return <ShareTest url={typeof url === "string" ? url : ""} />;
}
