import { bricolage } from "../_shared/font";
import { NewHabit } from "./form";
import "../_shared/screens.css";

// Prototype: create a build habit. ?state=empty|filled|saved opens a key state for screenshots.
export default async function Page(props: PageProps<"/prototypes/new-habit">) {
  const sp = await props.searchParams;
  const demo = sp.state === "filled" ? "filled" : sp.state === "saved" ? "saved" : "empty";
  return (
    <div className={bricolage.variable}>
      <NewHabit demo={demo} />
    </div>
  );
}
