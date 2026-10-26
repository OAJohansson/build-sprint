"use client";

// The combined Lab (dev only, L162). Listen = the full map with the Mentor's answers pinned as
// numbered notes on the soloed part; Make = the focused room for that part over the looped
// section. Everything that should survive the switch (solo/mute, playhead, loop, notes) lives here.
// URL: ?mode=listen|make · ?state=first|loading|catching|empty · ?data=worst · ?clean=1
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DEMO, SUGGEST, WORST, clock, suggestName, type Note, type PartId, type Section } from "./data";
import {
  AB, DataProvider, TIMELINE_PX, DeckDot, Head, Lanes, LoopStrip, Macros, PresetHead, Shell, Transport, s, useD,
  type DeckState, type LaneState,
} from "./ui";

type Mode = "listen" | "make";
export type View = "main" | "first" | "loading" | "catching" | "empty" | "menu";

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
          overlay={(id) => id === soloId && deck === "ready" ? (
            <Notes notes={notes.filter((x) => x.part === id)} open={open} setOpen={(n) => { setOpen(n); setAsking(false); }}
              bar={bar} asking={asking} setAsking={(a) => { setAsking(a); setOpen(null); }} partName={solo.name}
              section={sectionAt(bar).name} onAsk={ask} onMake={() => go("make")} lastLane={d.parts[d.parts.length - 1].id === id} />
          ) : null}
        />
      ) : (
        <div className={s.room}>
          <section className={s.synth}>
            <div className={s.synthTop}>
              <button className={s.textBtn} onClick={() => go("listen")}>← Whole song</button>
              <span className={s.who}>{solo.name} alone, {sec.name}, bars {sec.from}–{sec.to - 1}, looping</span>
            </div>
            <LoopStrip id={soloId} sec={sec} bar={bar} />
            <PresetHead partName={solo.name.toLowerCase()} initialOpen={view === "menu"} />
            <Macros size={96} color={solo.color} />
            <div className={s.suggestRow}>
              <p className={s.suggest}>Mentor: {SUGGEST}<br /><span className={s.faintLine}>Gold ticks mark those.</span></p>
              {/* Suggest settings (L157, T85): local patch matching on the soloed part. It only places or
                  updates the gold ticks; it never turns a knob. */}
              <button className={s.ghost}>Suggest settings</button>
            </div>
            <div className={s.checkRow}>
              <AB partName={solo.name.toLowerCase()} ab={ab} setAb={setAb} />
            </div>
          </section>
          <SaveBar name={suggestName(solo, d.track.short)} tags={[solo.name.toLowerCase(), d.track.key, `${d.track.bpm} BPM`, d.track.short]} />
          <MentorColumn notes={notes} open={open} setOpen={setOpen} onAsk={ask} bar={bar} partName={solo.name} />
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

type Group = { bar: number; notes: Note[] };

/** Notes on the soloed lane. Pins live in a thin strip above the clips; notes closer than 3% of the
 *  track share one pin ("4–6"). The open note hangs as a card below the lane, on the side away
 *  from the playhead, so it never covers the playhead or the part you're hearing. */
function Notes({ notes, open, setOpen, bar, asking, setAsking, partName, section, onAsk, onMake, lastLane }: {
  lastLane: boolean; notes: Note[]; open: number | null; setOpen: (n: number | null) => void; bar: number;
  asking: boolean; setAsking: (a: boolean) => void; partName: string; section: string;
  onAsk: (q: string) => void; onMake: () => void;
}) {
  const { d, pct } = useD();
  const gap = d.track.bars * 0.03;
  const groups: Group[] = [];
  for (const x of [...notes].sort((a, b) => a.bar - b.bar)) {
    const g = groups[groups.length - 1];
    if (g && x.bar - g.bar < gap) g.notes.push(x); else groups.push({ bar: x.bar, notes: [x] });
  }
  const label = (g: Group) => g.notes.length === 1 ? String(g.notes[0].n) : `${g.notes[0].n}–${g.notes[g.notes.length - 1].n}`;
  const openGroup = groups.find((g) => g.notes.some((x) => x.n === open));
  const note = openGroup?.notes.find((x) => x.n === open);
  // "+ Ask" sits left of the playhead (cards open to the right of it), unless the song has just begun.
  const askLeft = bar > d.track.bars * 0.1;
  const anchor = asking ? bar : openGroup?.bar;
  // Figma-style: the card's top-left sits 24px right of the pin, level with it. It goes left of
  // the pin instead when there's no room, or when going right would cross the playhead.
  const px = (b: number) => ((b - 1) / d.track.bars) * TIMELINE_PX;
  const pinW = (g?: Group) => (g ? label(g).length * 6.5 + 12 : 0); // shortcut: estimated pin width; measure it in the real build
  // The card hangs below the soloed lane (over the dimmed lanes), joined to its pin by a short
  // leader, so it never covers the part it talks about. Only when the soloed lane is the last one
  // does it sit beside the pin instead. Right of the pin when there's room and the playhead stays
  // clear; otherwise its right edge lines up with the pin.
  const below = !lastLane;
  const cardPos = (at: number): CSSProperties => {
    const w = Math.max(20, pinW(openGroup));
    const off = below ? 4 : 4 + w + 4;
    const room = px(at) + off + 420 <= TIMELINE_PX;
    const crosses = at < bar && px(at) + off + 420 >= px(bar);
    const left = room && !crosses ? `calc(${pct(at)} + ${off}px)` : `max(0px, calc(${pct(at)} + ${below ? 4 + w : -8}px - 420px))`;
    return { left, top: below ? "calc(100% + 10px)" : 5 };
  };
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {groups.map((g) => (
        <button key={g.bar} className={s.pin} data-open={openGroup === g ? "" : undefined} data-wide={g.notes.length > 1 ? "" : undefined}
          style={{ left: `calc(${pct(g.bar)} + 4px)` }}
          onClick={() => setOpen(openGroup === g ? null : g.notes[0].n)}
          aria-label={g.notes.length === 1 ? `Note ${g.notes[0].n} at bar ${g.bar}: ${g.notes[0].q}` : `Notes ${label(g)} near bar ${g.bar}`} aria-expanded={openGroup === g}>
          {label(g)}
        </button>
      ))}
      {!(asking || note) && <button className={s.askBtn} aria-expanded={asking}
        style={{ left: askLeft ? `calc(${pct(bar)} - 8px)` : `calc(${pct(bar)} + 8px)`, transform: askLeft ? "translateX(-100%)" : undefined }}
        onClick={() => setAsking(!asking)}>
        {notes.length === 0 ? `+ Ask about the ${partName.toLowerCase()} here` : "+ Ask"}
      </button>}
      {anchor !== undefined && (asking || note) && (
        <>
          {below && <i className={s.leader} style={{ left: `calc(${pct(anchor)} + ${asking ? 0 : 4 + Math.max(20, pinW(openGroup)) / 2}px)`, top: asking ? "calc(100% - 4px)" : 25 }} aria-hidden />}
          <div className={s.card} style={cardPos(anchor)} role="dialog" aria-label={note ? `Note ${note.n}` : "Ask the Mentor"}>
            <div className={s.cardHead}>
              <span className={s.ctx}>{note ? `Note ${note.n}, bar ${note.bar}` : `New note, ${section}, bar ${bar}`}</span>
              {note && openGroup && openGroup.notes.length > 1 && (
                <span className={s.cardNav}>
                  {openGroup.notes.map((x) => <button key={x.n} aria-pressed={x.n === open} onClick={() => setOpen(x.n)} aria-label={`Note ${x.n}`}>{x.n}</button>)}
                </span>
              )}
              <button className={s.x} onClick={() => { setOpen(null); setAsking(false); }} aria-label="Close">×</button>
            </div>
            {note ? (
              <>
                <p className={s.q}><span className={s.muted}>You:</span> {note.q}</p>
                <Answer text={note.a} lines={4} />
                {note.tags && <p className={s.facts}>{note.tags.join(" · ")}</p>}
                <AskForm placeholder={`Reply about bar ${note.bar}…`} onAsk={onAsk} />
                <button className={s.makeText} onClick={onMake}>Make a {partName.toLowerCase()} like this →</button>
              </>
            ) : (
              <>
                <AskForm placeholder={`What's the ${partName.toLowerCase()} doing here?`} onAsk={onAsk} autoFocus />
                <p className={s.facts}>The Mentor knows: {partName} alone, {section}, bar {bar}; pitch, timing and loudness. Not tone.</p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AskForm({ placeholder, onAsk, autoFocus }: { placeholder: string; onAsk: (q: string) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  return (
    <form className={s.askForm} onSubmit={(e) => { e.preventDefault(); if (q.trim()) { onAsk(q.trim()); setQ(""); } }}>
      <input className={s.ask} name="question" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Ask the Mentor (Enter sends)" autoFocus={autoFocus} />
    </form>
  );
}

function MentorColumn({ notes, open, setOpen, onAsk, bar, partName }: {
  notes: Note[]; open: number | null; setOpen: (n: number | null) => void; onAsk: (q: string) => void; bar: number; partName: string;
}) {
  return (
    <aside className={s.mentorCol} aria-label="Mentor">
      <span className={s.ctx}>Mentor, on the {partName.toLowerCase()} at bar {bar}</span>
      <div className={s.list}>
        {notes.length === 0 && <p className={s.facts}>No notes yet. Ask about the {partName.toLowerCase()}: the answer is pinned at bar {bar} on the map.</p>}
        {notes.map((x) => (
          <div key={x.n} className={s.item} data-open={open === x.n ? "" : undefined}>
            <button className={s.itemHead} onClick={() => setOpen(open === x.n ? null : x.n)} aria-expanded={open === x.n}>
              <b>{x.n}</b><span>{x.q}</span><small>bar {x.bar}</small>
            </button>
            {open === x.n && <>
              <Answer text={x.a} lines={6} />
              {x.tags && <p className={s.facts}>{x.tags.join(" · ")}</p>}
            </>}
          </div>
        ))}
      </div>
      <div className={s.askBar}><AskForm placeholder={`Ask about the ${partName.toLowerCase()}…`} onAsk={onAsk} /></div>
    </aside>
  );
}

function SaveBar({ name, tags }: { name: string; tags: string[] }) {
  return (
    <div className={s.saveBar}>
      <label className={s.saveLabel} htmlFor="save-name">Name</label>
      <input id="save-name" name="sound-name" autoComplete="off" className={s.input} defaultValue={name} />
      <span className={s.facts} title={tags.join(" · ")}>{tags.join(" · ")}</span>
      <button className={s.gold}>Save to library</button>
    </div>
  );
}

/** A long answer shows a few lines and "Read all". */
function Answer({ text, lines }: { text: string; lines: number }) {
  const [all, setAll] = useState(false);
  const long = text.length > lines * 60;
  return (
    <>
      <p className={s.answer} data-clamp={long && !all ? "" : undefined} data-expanded={long && all ? "" : undefined} style={{ WebkitLineClamp: lines }}>{text}</p>
      {long && <button className={s.textBtn} onClick={() => setAll(!all)} aria-expanded={all}>{all ? "Show less" : "Read all"}</button>}
    </>
  );
}
