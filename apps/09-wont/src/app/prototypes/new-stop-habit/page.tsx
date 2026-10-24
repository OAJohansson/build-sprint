import { bricolage } from "../_shared/font";
import { NewStopHabit } from "./form";
import "../_shared/screens.css";

// Prototype: create a stop habit. ?state=empty|filled|saved opens a key state for screenshots.
export default async function Page(props: PageProps<"/prototypes/new-stop-habit">) {
  const sp = await props.searchParams;
  const demo = sp.state === "filled" ? "filled" : sp.state === "saved" ? "saved" : "empty";
  return (
    <div className={bricolage.variable}>
      <NewStopHabit demo={demo} />
    </div>
  );
}
