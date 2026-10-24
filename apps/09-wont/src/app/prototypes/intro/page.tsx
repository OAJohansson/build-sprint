import { bricolage } from "../_shared/font";
import { Intro } from "./intro";
import "../board/board3.css";
import "./intro.css";

// Prototype: first-launch intro. ?scene=1|2|3|end opens one scene and holds it (for screenshots).
export default async function Page(props: PageProps<"/prototypes/intro">) {
  const sp = await props.searchParams;
  const map: Record<string, 0 | 1 | 2 | 3> = { "1": 0, "2": 1, "3": 2, end: 3 };
  const key = typeof sp.scene === "string" ? sp.scene : "";
  return (
    <div className={bricolage.variable}>
      <Intro start={map[key] ?? 0} hold={key in map} />
    </div>
  );
}
