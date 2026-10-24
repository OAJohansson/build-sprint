// Six AM's views in the app bar: Studio (make), Analyse (Ears: listen) and Settings (My taste).
import Link from "next/link";
import s from "./views-nav.module.css";

export function ViewsNav({ current }: { current: "studio" | "analyse" | "settings" }) {
  return (
    <nav className={s.views} aria-label="Views">
      <Link className={s.view} href="/" aria-current={current === "studio" ? "page" : undefined}>Studio</Link>
      <Link className={s.view} href="/analyse" aria-current={current === "analyse" ? "page" : undefined}>Analyse</Link>
      <Link className={s.view} href="/settings" aria-current={current === "settings" ? "page" : undefined}>Settings</Link>
    </nav>
  );
}
