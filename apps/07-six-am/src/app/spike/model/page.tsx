import type { Metadata } from "next";
import { ModelSpike } from "./model-spike";

// shortcut: throwaway Step 1 model spike (Ears v1); delete the page before the Ears PR merges,
// keep src/lib/ears/ (worker + features) for the real feature.
export const metadata: Metadata = { title: "Six AM · model spike", robots: { index: false } };

export default async function Page(props: PageProps<"/spike/model">) {
  const { test } = await props.searchParams;
  return <ModelSpike testMode={test === "tone"} />;
}
