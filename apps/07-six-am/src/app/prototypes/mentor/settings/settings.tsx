"use client";
// The smallest Settings view (L56): My taste, its recent updates, where it came from, run setup
// again. The profile is plain text the owner can edit; their edits win over what's learned.
import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/studio/logo";
import nav from "@/components/views-nav.module.css";
import s from "./settings.module.css";

const PROFILE = `You sort by feel, not by label. Most of what you keep sits between 120 and 128 BPM: raw, soulful house with a vocal you can sing along to, and tech house where the bassline and drums carry the track.

You like long builds that tease before the drop. You'll go fast and hard (140+) when it's camp or a party record, rarely for dark, purely instrumental techno.

Vocals matter: pop and R&B vocals over a soft beat are your sunrise music. Piano riffs over a steady, soft beat come up again and again.

Your own genre words: “Raw soulful queer house”, “Tech house”, “Hard trance”.`;

const UPDATES = [
  { when: "Today 14:02", what: "Added: you file vocal-hook tech house at ~126 BPM under “Tech house”.", from: "your genre on It Just Won't Do (Remix)" },
  { when: "Today 13:40", what: "Added: you've asked about ballroom house twice.", from: "your questions" },
  { when: "Yesterday", what: "Changed: “not much hard dance” to “fast and hard when it's camp or a party record”.", from: "More like this on Work (Edit)" },
  { when: "23 Oct", what: "First draft.", from: "setup: 3 playlists and 4 answers" },
];

export function Settings() {
  const [text, setText] = useState(PROFILE);
  const [saved, setSaved] = useState(true);
  return (
    <div className={s.root}>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <nav className={nav.views} aria-label="Views">
          <Link className={nav.view} href="/">Studio</Link>
          <Link className={nav.view} href="/prototypes/mentor">Analyse</Link>
          <Link className={nav.view} href="/prototypes/mentor/settings" aria-current="page">Settings</Link>
        </nav>
      </header>
      <main className={s.main}>
        <section className={s.col}>
          <h1 className={s.h1}>What Six AM has learned about you</h1>
          <p className={s.lede}>The Mentor reads this before every answer. Change anything: your words win over what it learns.</p>
          <div className={s.fieldHead}>
            <label htmlFor="taste" className={s.label}>My taste</label>
            <span className={s.saved}>{saved ? "Saved" : "Saving…"}</span>
          </div>
          <textarea id="taste" className={s.profile} value={text} rows={14} onChange={(e) => { setText(e.target.value); setSaved(false); setTimeout(() => setSaved(true), 600); }} />
        </section>
        <aside className={s.side}>
          <h2 className={s.h2}>Recent updates</h2>
          <ol className={s.updates}>
            {UPDATES.map((u) => (
              <li key={u.when + u.what}>
                <span className={s.when}>{u.when}</span>
                <p>{u.what}</p>
                <span className={s.from}>From {u.from}</span>
              </li>
            ))}
          </ol>
          <h2 className={s.h2}>Where it came from</h2>
          <p className={s.src}>Old banger remixx · Afro house · drum &amp; basssss<br /><span>118 tracks: titles, artists and tags only. Nothing was listened to.</span></p>
          <button className={s.btn}>Run setup again</button>
          <p className={s.fine}>Adds to this profile; it doesn&apos;t replace it.</p>
        </aside>
      </main>
    </div>
  );
}
