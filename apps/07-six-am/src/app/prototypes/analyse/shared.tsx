"use client";

// Pieces every Analyse direction shares: the app bar (Studio / Analyse), the SoundCloud embed,
// the energy meter, the actions. The look is the Studio's (studio.module.css tokens).
import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/studio/logo";
import { claudeText, type Row } from "./sample";
import s from "./analyse.module.css";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function AppBar({ right }: { right?: React.ReactNode }) {
  return (
    <header className={s.appBar}>
      <div className={s.logo}><Logo className={s.mark} />Six AM</div>
      <nav className={s.views} aria-label="Views">
        <Link className={s.view} href="/">Studio</Link>
        <a className={cx(s.view, s.viewOn)} aria-current="page">Analyse</a>
      </nav>
      <div className={s.appRight}>{right}</div>
    </header>
  );
}

/** The official SoundCloud widget, compact. Its own look is SoundCloud's, not ours. */
export function Embed({ url, height = 20 }: { url?: string; height?: number }) {
  if (!url) return <div className={s.embedEmpty} style={{ height }}>No track loaded</div>;
  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23f2b134&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
  return <iframe className={s.embed} title="SoundCloud player" height={height} src={src} allow="autoplay" />;
}

/** Five steps, lit in gold up to the energy. A still meter, never a live level. */
export function Energy({ value, wide }: { value?: number; wide?: boolean }) {
  if (value == null) return <span className={s.dim}>–</span>;
  const lit = Math.max(1, Math.round(value * 5));
  return (
    <span className={cx(s.meter, wide && s.meterWide)} role="img" aria-label={`Energy ${Math.round(value * 100)} of 100`}>
      {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < lit ? s.meterOn : undefined} />)}
    </span>
  );
}

export function useActions() {
  const [note, setNote] = useState<string | null>(null);
  const flash = (t: string) => { setNote(t); setTimeout(() => setNote(null), 2200); };
  return {
    note,
    copy: async (r: Row) => {
      try { await navigator.clipboard.writeText(claudeText(r)); flash("Copied for Claude"); }
      catch { flash("Couldn't copy: clipboard blocked"); }
    },
    // shortcut: prototype only, the real button sets the Studio project tempo (F10).
    setBpm: (r: Row) => flash(`Studio set to ${Math.round(r.bpm ?? 124)} BPM`),
  };
}

export const Icon = {
  copy: <svg viewBox="0 0 16 16" aria-hidden><path d="M5 2h7a1 1 0 0 1 1 1v8h-1.5V3.5H5zM3 5h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm.5 1.5v6h6v-6z" fill="currentColor" /></svg>,
  tempo: <svg viewBox="0 0 16 16" aria-hidden><path d="M6 1h4l3 14H3zm1.2 1.5L5 13.5h6L8.8 2.5zM8 5l3.5-2 .7 1.2L8.7 6.2 9 10H7z" fill="currentColor" /></svg>,
};
