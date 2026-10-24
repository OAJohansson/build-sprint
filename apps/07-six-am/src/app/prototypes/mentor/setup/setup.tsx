"use client";
// The setup step's question screen: a focused dialog over the Analyse view (five minutes deserves
// focus, the panel is too narrow for three previews). Tap an answer, optionally say more.
import { useState } from "react";
import { DemoAnalyse } from "@/components/analyse/analyse-view";
import s from "./setup.module.css";

const OPTIONS = [
  { title: "Music Is The Answer (Edit)", by: "Retrouve", tags: "House", from: "Old banger remixx" },
  { title: "Work (Edit)", by: "Pupa Nas T x FOVOS", tags: "Trance · hard bounce · hard trance", from: "B b baaangers" },
  { title: "Lost in The Loop", by: "Cărbune Adrian", tags: "House · piano", from: "Old banger remixx" },
];

export function Setup() {
  const [pick, setPick] = useState(2);
  const [playing, setPlaying] = useState<number | null>(null);
  const [more, setMore] = useState("The piano riffs. Soft, but I can still dance to it.");
  return (
    <div className={s.wrap}>
      <div aria-hidden className={s.behind}><DemoAnalyse listening={false} /></div>
      <div className={s.scrim} />
      <div role="dialog" aria-modal="true" aria-labelledby="setup-title" className={s.dialog}>
        <header className={s.head}>
          <h2 id="setup-title" className={s.title}>Getting to know your taste</h2>
          <button className={s.textBtn}>Finish later</button>
        </header>
        <div className={s.steps}>
          <ol>
            <li className={s.done}>Playlists</li>
            <li className={s.done}>First draft</li>
            <li aria-current="step">Questions · 2 of 4</li>
            <li>Anything else</li>
          </ol>
          <div className={s.bar}><i style={{ width: "56%" }} /></div>
        </div>
        <p className={s.read}>Read from 3 playlists, 118 tracks: titles, artists and tags only. Nothing was listened to.</p>

        <h3 className={s.q}>Which of these three is most you?</h3>
        <p className={s.hint}>Play a few seconds of each if you like. The SoundCloud player plays them; nothing is recorded.</p>
        <div role="radiogroup" className={s.options}>
          {OPTIONS.map((o, i) => (
            <div key={o.title} className={s.option} data-picked={pick === i || undefined}>
              <button className={s.play} aria-label={`${playing === i ? "Stop" : "Play"} a preview of ${o.title}`} onClick={() => setPlaying(playing === i ? null : i)}>
                {playing === i ? "■" : "▶"}
              </button>
              <button role="radio" aria-checked={pick === i} className={s.optBody} onClick={() => setPick(i)}>
                <span className={s.optTitle}>{o.title}<span className={s.by}>{o.by}</span></span>
                <span className={s.tags}>tagged {o.tags} · from {o.from}</span>
              </button>
              <span className={s.radio} aria-hidden />
            </div>
          ))}
        </div>

        <label className={s.moreLabel} htmlFor="say-more">Say more <span>(optional): what makes it you?</span></label>
        <textarea id="say-more" className={s.more} rows={2} value={more} onChange={(e) => setMore(e.target.value)} placeholder="The vocal, the drums, where you'd play it…" />

        <footer className={s.foot}>
          <button className={s.textBtn}>Back</button>
          <span className={s.next}>Next: dancing, driving or deep listening?</span>
          <button className={s.textBtn}>Skip</button>
          <button className={s.btn}>Next</button>
        </footer>
      </div>
    </div>
  );
}
