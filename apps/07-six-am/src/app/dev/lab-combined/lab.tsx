"use client";

// Listen = the full map with the Mentor's answers pinned as numbered notes; Make = the focused
// room for the soloed part over the looped section. Notes live here, so both modes share them.
import { useState } from "react";
import { LOOP, MEASURED, NOW, SUGGEST, pct } from "./data";
import { AB, Deck, Lanes, Macros, MatchRow, PresetHead, SaveRow, Shell, Strip, TrackHead, Transport, Zoom, part, s } from "./shared";
import v from "./v.module.css";

type Mode = "listen" | "make";
type Note = { n: number; bar: number; q: string; a: string; tags?: string[] };

const NOTES: Note[] = [
  { n: 1, bar: 17, q: "When does the bass come in?", a: "Bar 17, halfway through the Intro, on its own for 16 bars before the Build adds the pad." },
  { n: 2, bar: 97, q: "What's this bass doing?", a: "Short A1 notes between the kicks, gone before the next one. That gap is the bounce. I measure pitch, timing and loudness, not tone.", tags: MEASURED },
  { n: 3, bar: 177, q: "Is the second Drop the same bass?", a: "Same notes and timing as Drop 1; from bar 177 a pluck layer joins it (estimated)." },
];

const LANE_H = 150, LABEL = 200, RULER = 46, CHORD = 26;
const BASS_TOP = RULER + CHORD + LANE_H; // the bass lane is the second part

export function Lab({ initial, clean }: { initial: Mode; clean?: boolean }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [open, setOpen] = useState<number | null>(2);
  const go = (m: Mode) => {
    setMode(m);
    const url = new URL(location.href);
    url.searchParams.set("mode", m);
    history.replaceState(null, "", url);
  };
  return (
    <Shell>
      <TrackHead small>
        <Transport compact />
        <div className={v.switch} role="group" aria-label="Mode">
          <button aria-pressed={mode === "listen"} onClick={() => go("listen")}>Listen</button>
          <button aria-pressed={mode === "make"} onClick={() => go("make")}>Make</button>
        </div>
        <Deck />
      </TrackHead>
      {clean && <style>{"nextjs-portal{display:none}"}</style>}
      {mode === "listen" ? <Listen open={open} setOpen={setOpen} onMake={() => go("make")} /> : <Make open={open} setOpen={setOpen} onBack={() => go("listen")} />}
    </Shell>
  );
}

function Listen({ open, setOpen, onMake }: { open: number | null; setOpen: (n: number | null) => void; onMake: () => void }) {
  const note = NOTES.find((x) => x.n === open);
  return (
    <div className={v.wrap}>
      <Lanes laneH={LANE_H} label={LABEL} onMake={onMake} />
      <div className={v.layer} style={{ left: LABEL }}>
        {NOTES.map((x) => (
          <button key={x.n} className={v.pin} data-open={open === x.n ? "" : undefined}
            // pins sit at the top edge of the bass lane, nudged right of their bar so the playhead stays clear
            style={{ left: `calc(${pct(x.bar)} + 12px)`, top: BASS_TOP + 6 }}
            onClick={() => setOpen(open === x.n ? null : x.n)} aria-label={`Note ${x.n}, bar ${x.bar}`}>{x.n}</button>
        ))}
        {note && (
          // the open thread hangs below the pin, to the left of the playhead when the note is at or after it
          <div className={v.note} data-side={note.bar >= NOW.bar ? "left" : "right"}
            style={note.bar >= NOW.bar
              ? { right: `calc(${100 - parseFloat(pct(note.bar))}% + 14px)`, top: BASS_TOP + 40 }
              : { left: `calc(${pct(note.bar)} + 40px)`, top: BASS_TOP + 40 }}>
            <div className={v.noteHead}><span className={s.ctx}>Note {note.n} · Bass · bar {note.bar}</span><button className={s.textBtn} onClick={() => setOpen(null)} aria-label="Close note">×</button></div>
            <p className={s.you}>{note.q}</p>
            <p className={s.mentor}>{note.a}</p>
            {note.tags && <span className={s.tags}>{note.tags.map((t) => <i key={t}>{t}</i>)}</span>}
            <input className={s.ask} placeholder={`Reply, or ask about bar ${note.bar}…`} aria-label="Reply to the Mentor" style={{ width: "100%" }} />
            <button className={s.ghost} onClick={onMake}>Make a bass like this →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Make({ open, setOpen, onBack }: { open: number | null; setOpen: (n: number | null) => void; onBack: () => void }) {
  const bass = part("bass");
  return (
    <>
      <div className={v.strip}><Strip /></div>
      <div className={v.room}>
        <section className={v.col}>
          <button className={s.textBtn} onClick={onBack}>← Back to Listen · notes kept</button>
          <span className={s.who}>The original · {bass.name} alone · {LOOP.name} · bars {LOOP.from}–{LOOP.to - 1}</span>
          <Zoom height={200} />
          <p className={s.muted} style={{ margin: 0, fontSize: 12, lineHeight: 1.6 }}>Looping while you work. Sub-layers and chords are estimates.</p>
        </section>
        <section className={v.col}>
          <span className={s.who}>Yours</span>
          <PresetHead />
          <AB />
          <Macros size={52} tight />
          <p className={s.suggest}><span className={s.tick} aria-hidden /> Mentor: {SUGGEST}</p>
          <MatchRow />
          <div className={v.save}><SaveRow stacked /></div>
        </section>
        <aside className={`${v.col} ${v.mentor}`}>
          <span className={s.ctx}>Mentor · hearing Bass alone · Drop · bar {NOW.bar}</span>
          {NOTES.map((x) => (
            <div key={x.n} className={v.thread} data-open={open === x.n ? "" : undefined}>
              <button className={v.threadHead} onClick={() => setOpen(open === x.n ? null : x.n)}>
                <b>{x.n}</b><span>{x.q}</span><small>bar {x.bar}</small>
              </button>
              {open === x.n && <>
                <p className={s.mentor}>{x.a}</p>
                {x.tags && <span className={s.tags}>{x.tags.map((t) => <i key={t}>{t}</i>)}</span>}
              </>}
            </div>
          ))}
          <input className={s.ask} placeholder="Ask about the bass…" aria-label="Ask the Mentor" style={{ width: "100%", marginTop: "auto" }} />
        </aside>
      </div>
    </>
  );
}
