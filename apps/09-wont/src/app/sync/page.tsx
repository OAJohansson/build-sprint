import type { Metadata } from "next";
import { SyncScreen } from "@/components/sync-screen";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.app.titles.sync };

// v1.1 (L27): type the access code once per device to share one board.
export default function Page() {
  return <SyncScreen />;
}
