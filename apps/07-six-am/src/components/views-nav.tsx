// The two views of Six AM in the app bar: Studio (make) and Analyse (Ears v1: listen).
import Link from "next/link";
import s from "./views-nav.module.css";

export function ViewsNav({ current }: { current: "studio" | "analyse" }) {
  return (
    <nav className={s.views} aria-label="Views">
      <Link className={s.view} href="/" aria-current={current === "studio" ? "page" : undefined}>Studio</Link>
      <Link className={s.view} href="/analyse" aria-current={current === "analyse" ? "page" : undefined}>Analyse</Link>
    </nav>
  );
}
