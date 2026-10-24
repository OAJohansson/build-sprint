import { Bricolage_Grotesque } from "next/font/google";
import { Harness } from "./harness";
import type { DemoState } from "./board";
import "./board.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-wb" });

// Prototype surface for the board (design-session, Discover run 2). Delete once a variant is promoted.
// ?v=1..3 picks the variant; ?state=write|slip opens a key state for screenshots.
export default async function Page(props: PageProps<"/prototypes/board">) {
  const sp = await props.searchParams;
  const v = Math.min(Math.max(parseInt(String(sp.v ?? "1"), 10) || 1, 1), 3) - 1;
  const demo: DemoState = sp.state === "write" ? "write" : sp.state === "slip" ? "slip" : "main";
  return (
    <div className={bricolage.variable}>
      <Harness initial={v} demo={demo} />
    </div>
  );
}
