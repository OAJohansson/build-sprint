import { bricolage } from "../_shared/font";
import { SlipMoments, type SlipDemo } from "./moments";
import "../_shared/screens.css";
import "./slip.css";

// Prototype: slip and urge moments. ?state=card|size|slipped|urge|urge-done for screenshots.
export default async function Page(props: PageProps<"/prototypes/slip">) {
  const sp = await props.searchParams;
  const states: SlipDemo[] = ["card", "size", "slipped", "urge", "urge-done"];
  const demo = states.includes(sp.state as SlipDemo) ? (sp.state as SlipDemo) : "card";
  return (
    <div className={bricolage.variable}>
      <SlipMoments demo={demo} />
    </div>
  );
}
