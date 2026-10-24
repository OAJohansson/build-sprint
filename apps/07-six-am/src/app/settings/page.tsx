import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

// Settings (M9, L56): My taste, what changed it, where it came from, run setup again.
export const metadata: Metadata = { title: "Six AM · Settings" };

export default function Page() {
  return <SettingsView />;
}
