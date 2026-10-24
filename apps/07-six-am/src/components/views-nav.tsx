// Six AM's views in the app bar: Studio (make) and Analyse (Ears: listen). Settings sits apart, as
// a small icon in the bar's right corner (L91).
import Link from "next/link";
import { Settings } from "lucide-react";
import s from "./views-nav.module.css";

export function ViewsNav({ current }: { current: "studio" | "analyse" | "settings" }) {
  return (
    <nav className={s.views} aria-label="Views">
      <Link className={s.view} href="/" aria-current={current === "studio" ? "page" : undefined}>Studio</Link>
      <Link className={s.view} href="/analyse" aria-current={current === "analyse" ? "page" : undefined}>Analyse</Link>
    </nav>
  );
}

/** The corner icon that opens Settings. */
export function SettingsLink({ current }: { current?: boolean }) {
  return (
    <Link className={s.corner} href="/settings" aria-label="Settings" title="Settings" aria-current={current ? "page" : undefined}>
      <Settings size={17} strokeWidth={1.5} aria-hidden />
    </Link>
  );
}
