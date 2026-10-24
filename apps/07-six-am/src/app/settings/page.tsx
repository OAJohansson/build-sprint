import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

// Settings (L91, L92): the music taste profile (locked until enough data) and the cost estimate.
export const metadata: Metadata = { title: "Six AM · Settings" };

export default function Page() {
  return <SettingsView />;
}
