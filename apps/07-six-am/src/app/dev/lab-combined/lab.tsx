"use client";

// The combined Lab (dev only, L162). Listen = the full map with the Mentor's answers pinned as
// numbered notes on the soloed part; Make = the focused room for that part over the looped
// section. Everything that should survive the switch (solo/mute, playhead, loop, notes) lives here.
// URL: ?mode=listen|make · ?state=first|loading|catching|empty · ?data=worst · ?clean=1
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DEMO, SUGGEST, WORST, clock, suggestName, type Note, type PartId, type Section } from "./data";
import {
  AB, DataProvider, DeckDot, Head, Lanes, Macros, PresetHead, Shell, Transport, Zoom, s, useD,
  type DeckState, type LaneState,
} from "./ui";

type Mode = "listen" | "make";
export type View = "main" | "first" | "loading" | "catching" | "empty";

export function Lab({ mode, view, worst, clean }: { mode: Mode; view: View; worst: boolean; clean: boolean }) {
  return (
    <DataProvider value={worst ? WORST : DEMO}>
      <Inner initialMode={mode} view={view} />
      {clean && <style>{"nextjs-portal{display:none}"}</style>}
    </DataProvider>
  );
}

const soloState = (id: PartId): LaneState => ({ drums: "dim", bass: "dim", other: "dim", vocals: "dim", [id]: "solo" });

function Inner({ initialMode, view }: { initialMode: Mode; view: View }) {
  const { d, part, sectionAt } = useD();
  const first = view === "first";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [deck, setDeck] = useState<DeckState>(first ? "closed" : view === "loading" ? "loading" : "ready");
  const [ready, setReady] = useState(view === "loading" ? 42 : 100);
  const [playing, setPlaying] = useState(!first && view !== "loading");
  const [st, setSt] = useState<LaneState>(soloState("bass"));
  const [bar, setBar] = useState(first || view === "loading" ? 1 : view === "catching" ? 113 : 97);
  const [loop, setLoop] = useState<Section | null>(first || view === "loading" ? null : d.sections[2]);
  const [catching, setCatching] = useState(view === "catching");
  const [notes, setNotes] = useState<Note[]>(first || view === "empty" ? [] : d.notes);
  const [open, setOpen] = useState<number | null>(first || view === "empty" ? null : (d.notes.find((n) => n.bar === 97)?.n ?? null));
  const [asking, setAsking] = useState(false);
  const [ab, setAb] = useState<"a" | "b">("a");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const soloId = (Object.keys(st) as PartId[]).find((k) => st[k] === "solo") ?? "bass";
  const solo = part(soloId);

  const go = (m: Mode) => {
    setMode(m);
    const url = new URL(location.href);
    url.searchParams.set("mode", m);
    history.replaceState(null, "", url);
  };
  const seek = (b: number) => {
    setBar(b);
    setCatching(true);
    clearTimeout(timer.current);
    // shortcut: a fixed 5 s; the real one clears when separation has refilled its buffer.
    timer.current = setTimeout(() => setCatching(false), 5000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  // shortcut: simulated model download (the real one reports ~30 s first time, ~1 s cached).
  useEffect(() => {
    if (deck !== "loading" || view === "loading") return;
    const t = setInterval(() => setReady((r) => {
      if (r >= 100) { clearInterval(t); setDeck("ready"); setPlaying(true); setLoop(d.sections[2]); setBar(97); return 100; }
      return r + 10;
    }), 250);
    return () => clearInterval(t);
  }, [deck, view, d.sections]);

  const ask = (q: string) => {
    const n = Math.max(0, ...notes.map((x) => x.n)) + 1;
    setNotes([...notes, { n, part: soloId, bar, q, a: "…" }]);
    setOpen(n);
    setAsking(false);
    // shortcut: a canned answer; the real Mentor gets the part, section, bar and measurements.
    setTimeout(() => setNotes((xs) => xs.map((x) => x.n === n ? { ...x, a: `At bar ${bar} the ${solo.name.toLowerCase()} keeps the same short A1 notes. I can only measure pitch, timing and loudness here.` } : x)), 900);
  };

  const status = deck === "loading"
    ? `Getting ready… ${ready}%${view === "loading" ? " · first time only, about 18 s" : ""}`
    : catching ? "catching up…" : null;
  const sec = loop ?? sectionAt(bar);

  return (
    <Shell>
      <Head>
        <Transport playing={playing} onPlay={() => setPlaying(!playing)} disabled={deck !== "ready"}
          bar={`${clock(bar, d.track.bpm)} · bar ${bar}`} loop={loop} onClearLoop={() => setLoop(null)} status={status} />
        <div className={s.switch} role="group" aria-label="Mode">
          <button aria-pressed={mode === "listen"} onClick={() => go("listen")}>Listen</button>
          <button aria-pressed={mode === "make"} onClick={() => go("make")}>Make</button>
        </div>
        <DeckDot deck={deck} />
      </Head>
      {deck === "loading" && <div className={s.progress}><i style={{ width: `${ready}%` }} /></div>}
      {(deck === "closed" || deck === "sharing") && <DeckSteps deck={deck} setDeck={setDeck} setReady={setReady} />}
      {mode === "listen" ? (
        <Lanes
          st={st} bar={bar} onSeek={seek} catching={catching} loop={loop} disabled={deck !== "ready"}
          onLoop={(x) => setLoop(loop?.from === x.from ? null : x)}
          onSolo={(id) => setSt(st[id] === "solo" ? { drums: "on", bass: "on", other: "on", vocals: "on" } : soloState(id))}
          onMute={(id) => setSt({ ...st, [id]: st[id] === "off" ? "on" : "off" })}
          onMake={deck === "ready" ? () => go("make") : undefined}
          overlay={(id) => id === soloId && deck === "ready" ? (
            <Pins notes={notes.filter((x) => x.part === id)} open={open} setOpen={(n) => { setOpen(n); setAsking(false); }}
              bar={bar} asking={asking} setAsking={(a) => { setAsking(a); setOpen(null); }} empty={notes.length === 0} partName={solo.name} />
          ) : null}
          after={deck === "ready" && (asking || open !== null) ? {
            id: soloId,
            node: <NoteRow key={open ?? "ask"} note={asking ? null : notes.find((x) => x.n === open) ?? null} bar={bar} partName={solo.name}
              section={sectionAt(bar).name} onClose={() => { setOpen(null); setAsking(false); }} onAsk={ask} onMake={() => go("make")} />,
          } : null}
        />
      ) : (
        <div className={s.room}>
          <section className={s.col}>
            <button className={s.textBtn} onClick={() => go("listen")}>← Back to the whole song</button>
            <span className={s.who}>Original · {solo.name} alone · {sec.name} · bars {sec.from}–{sec.to - 1}</span>
            <Zoom id={soloId} sec={sec} bar={bar} />
          </section>
          <section className={s.col}>
            <PresetHead />
            <AB partName={solo.name.toLowerCase()} ab={ab} setAb={setAb} />
            <Macros size={80} />
            <p className={s.suggest}><span className={s.tick} aria-hidden /> <span><b>Mentor:</b> {SUGGEST}</span></p>
            <div className={s.matchRow}>
              <button className={s.ghost}>✦ Match it</button>
              <button className={s.textBtn}>Make a loop from words</button>
            </div>
          </section>
          <SaveBar name={suggestName(solo, d.track.short)} tags={[solo.name.toLowerCase(), d.track.key, `${d.track.bpm} BPM`, d.track.short]} />
          <MentorColumn notes={notes} open={open} setOpen={setOpen} onAsk={ask} bar={bar} partName={solo.name} section={sectionAt(bar).name} />
        </div>
      )}
    </Shell>
  );
}

/** First visit: one calm instruction at a time to get the Deck playing. */
function DeckSteps({ deck, setDeck, setReady }: { deck: DeckState; setDeck: (d: DeckState) => void; setReady: (n: number) => void }) {
  return (
    <div className={s.steps} aria-live="polite">
      {deck === "closed" ? (
        <>
          <p><b>Open the Deck to listen.</b> It plays this track from SoundCloud in a small window, and you hear the parts here.</p>
          <button className={s.gold} onClick={() => setDeck("sharing")}>Open the Deck</button>
        </>
      ) : (
        <>
          <p><b>In Chrome&rsquo;s dialog, pick the “Six AM Deck” tab and press Share.</b> Its sound moves here; nothing is recorded.</p>
          <button className={s.ghost} onClick={() => { setReady(0); setDeck("loading"); }}>I&rsquo;ve shared it</button>
          <button className={s.textBtn} onClick={() => setDeck("closed")}>Cancel</button>
        </>
      )}
    </div>
  );
}

/** Numbered notes on the soloed lane. Pins sit right of their bar (the playhead stays clear) and
 *  stack into up to three rows when they are close. "+ Ask" sits at the playhead, at the foot. */
function Pins({ notes, open, setOpen, bar, asking, setAsking, empty, partName }: {
  notes: Note[]; open: number | null; setOpen: (n: number | null) => void; bar: number;
  asking: boolean; setAsking: (a: boolean) => void; empty: boolean; partName: string;
}) {
  const { d, pct } = useD();
  const gap = d.track.bars * 0.03;
  const last: number[] = [];
  const placed = [...notes].sort((a, b) => a.bar - b.bar).map((x) => {
    let r = last.findIndex((l) => x.bar - l >= gap);
    if (r < 0) r = last.length < 3 ? last.length : 2;
    last[r] = x.bar;
    return { x, r };
  });
  const nearEnd = bar > d.track.bars * 0.8;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {placed.map(({ x, r }) => (
        <button key={x.n} className={s.pin} data-open={open === x.n ? "" : undefined} style={{ left: `calc(${pct(x.bar)} + 12px)`, top: 6 + r * 26 }}
          onClick={() => setOpen(open === x.n ? null : x.n)} aria-label={`Note ${x.n} at bar ${x.bar}: ${x.q}`} aria-expanded={open === x.n}>{x.n}</button>
      ))}
      <button className={s.askPin} data-on={asking ? "" : undefined} aria-expanded={asking}
        style={{ left: nearEnd ? `calc(${pct(bar)} - 10px)` : `calc(${pct(bar)} + 10px)`, transform: nearEnd ? "translateX(-100%)" : undefined } as CSSProperties}
        onClick={() => setAsking(!asking)}>
        {empty ? `+ Ask about the ${partName.toLowerCase()} here` : "+ Ask"}
      </button>
    </div>
  );
}

/** A note opens as its own row under the part's lane: nothing on the map is covered. */
function NoteRow({ note, bar, partName, section, onClose, onAsk, onMake }: {
  note: Note | null; bar: number; partName: string; section: string;
  onClose: () => void; onAsk: (q: string) => void; onMake: () => void;
}) {
  const { d } = useD();
  const at = note?.bar ?? bar;
  const frac = (at - 1) / d.track.bars;
  return (
    <div className={s.noteRow} role="region" aria-label={note ? `Note ${note.n}` : "Ask the Mentor"}>
      <i className={s.caret} style={{ left: `calc(200px + (100% - 200px) * ${frac} + 12px)` }} aria-hidden />
      <div className={s.noteSide}>
        <span className={s.ctx}>{note ? `Note ${note.n} · bar ${note.bar}` : `New note · bar ${bar}`}</span>
        <button className={s.textBtn} onClick={onClose}>Close</button>
      </div>
      {note ? (
        <div className={s.noteBody}>
          <div className={s.thread}>
            <p className={s.you}>{note.q}</p>
            <Answer text={note.a} />
            {note.tags && <span className={s.tags}>{note.tags.map((t) => <i key={t}>{t}</i>)}</span>}
          </div>
          <div className={s.noteActions}>
            <AskForm placeholder={`Reply about bar ${note.bar}…`} onAsk={onAsk} />
            <button className={s.makeLink} onClick={onMake}>Make a {partName.toLowerCase()} like this →</button>
          </div>
        </div>
      ) : (
        <div className={s.noteBody}>
          <div className={s.thread}>
            <AskForm placeholder={`What's the ${partName.toLowerCase()} doing here?`} onAsk={onAsk} autoFocus />
          </div>
          <p className={s.knows}>The Mentor knows: {partName} alone · {section} · bar {bar} · pitch, timing and loudness. It can&rsquo;t hear tone.</p>
        </div>
      )}
    </div>
  );
}

function AskForm({ placeholder, onAsk, autoFocus }: { placeholder: string; onAsk: (q: string) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  return (
    <form className={s.askForm} onSubmit={(e) => { e.preventDefault(); if (q.trim()) { onAsk(q.trim()); setQ(""); } }}>
      <input className={s.ask} name="question" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Ask the Mentor" autoFocus={autoFocus} />
      <button className={s.ghost} type="submit">Ask</button>
    </form>
  );
}

function MentorColumn({ notes, open, setOpen, onAsk, bar, partName, section }: {
  notes: Note[]; open: number | null; setOpen: (n: number | null) => void; onAsk: (q: string) => void; bar: number; partName: string; section: string;
}) {
  return (
    <aside className={s.mentorCol} aria-label="Mentor">
      <span className={s.ctx}>Mentor · {partName} alone · {section} · bar {bar}</span>
      <div className={s.list}>
        {notes.length === 0 && <p className={s.knows}>No notes yet. Ask about the {partName.toLowerCase()}: the answer is pinned at bar {bar} on the map.</p>}
        {notes.map((x) => (
          <div key={x.n} className={s.item} data-open={open === x.n ? "" : undefined}>
            <button className={s.itemHead} onClick={() => setOpen(open === x.n ? null : x.n)} aria-expanded={open === x.n}>
              <b>{x.n}</b><span>{x.q}</span><small>bar {x.bar}</small>
            </button>
            {open === x.n && <>
              <p className={s.answer} tabIndex={0}>{x.a}</p>
              {x.tags && <span className={s.tags}>{x.tags.map((t) => <i key={t}>{t}</i>)}</span>}
            </>}
          </div>
        ))}
      </div>
      <AskForm placeholder={`Ask about the ${partName.toLowerCase()}…`} onAsk={onAsk} />
    </aside>
  );
}

function SaveBar({ name, tags }: { name: string; tags: string[] }) {
  return (
    <div className={s.saveBar}>
      <label className={s.saveLabel} htmlFor="save-name">Name</label>
      <input id="save-name" name="sound-name" autoComplete="off" className={s.input} defaultValue={name} />
      <span className={s.tags}>{tags.map((t) => <i key={t} title={t}>{t}</i>)}</span>
      <button className={s.gold}>Save to library</button>
    </div>
  );
}

/** A long answer shows three lines and "Read all"; the note row stays short. */
function Answer({ text }: { text: string }) {
  const [all, setAll] = useState(false);
  const long = text.length > 220;
  return (
    <>
      <p className={s.answer} data-clamp={long && !all ? "" : undefined}>{text}</p>
      {long && <button className={s.textBtn} onClick={() => setAll(!all)} aria-expanded={all}>{all ? "Show less" : "Read all"}</button>}
    </>
  );
}
