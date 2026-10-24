import type { Metadata } from "next";
import { Harness } from "./harness";

// Phase 3 Discover: ten arrangement-map directions behind the picker. Isolated; nothing in
// production imports it. ?v=1..10 picks one, &state=listening shows the map half-heard.
export const metadata: Metadata = { title: "Six AM · Map prototypes" };

export default function Page() {
  return <Harness />;
}
