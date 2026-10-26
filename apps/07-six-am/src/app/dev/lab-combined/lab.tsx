"use client";

// The combined Lab (dev only, L162, sign-off changes L167–L171). Listen = the full map with the
// Mentor's questions pinned as dots on the part you're focused on; Make = the focused room for that
// part over the looped section. Everything that should survive the switch (what you hear, focus,
// playhead, loop, the Mentor chat) lives here.
// URL: ?mode=listen|make · ?state=first|loading|catching|empty|menu · ?data=worst · ?clean=1
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { DEMO, SUGGEST, WORST, clock, suggestName, type Note, type PartId, type Section } from "./data";
import {
  AB, DataProvider, TIMELINE_PX, DeckDot, Head, HearBar, Lanes, LoopStrip, Macros, PresetHead, Shell, Transport, s, useD,
  type DeckState, type Hear, type LaneState,
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

const laneState = (h: Hear): LaneState => {
  const ids: PartId[] = ["drums", "bass", "other", "vocals"];
  return Object.fromEntries(ids.map((id) => [id, !h.parts.length ? "on" : (h.parts.includes(id) === (h.mode === "only")) ? "on" : "dim"])) as LaneState;
};

function Inner({ initialMode, view }: { initialMode: Mode; view: View }) {
  const { d, part, sectionAt, secName } = useD();
  const first = view === "first";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [deck, setDeck] = useState<DeckState>(first ? "closed" : view === "loading" ? "loading" : "ready");
  const [ready, setReady] = useState(view === "loading" ? 42 : 100);
  const [playing, setPlaying] = useState(!first && view !== "loading");
  const [hear, setHearRaw] = useState<Hear>({ parts: ["bass"], mode: "only" });
  // The part the notes, "+ Ask" and Make are about: the last part picked on its own (bass to start).
  const [focus, setFocus] = useState<PartId>("bass");
  const setHear = (h: Hear) => { setHearRaw(h); if (h.parts.length === 1) setFocus(h.parts[0]); };
  const [bar, setBar] = useState(first || view === "loading" ? 1 : view === "catching" ? 113 : 97);
  const [loop, setLoop] = useState<Section | null>(first || view === "loading" ? null : d.sections[2]);
  const [catching, setCatching] = useState(view === "catching");
  const [notes, setNotes] = useState<Note[]>(first || view === "empty" ? [] : d.notes);
  const [open, setOpen] = useState<number | null>(first || view === "empty" ? null : (d.notes.find((n) => n.bar === 97)?.n ?? null));
  const [asking, setAsking] = useState(false);
  const [ab, setAb] = useState<"a" | "b">("a");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const soloId = focus;
  const solo = part(focus);

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
          bar={bar} loop={loop} onClearLoop={() => setLoop(null)} status={status} />
        <div className={s.switch} role="group" aria-label="Mode">
          <button aria-pressed={mode === "listen"} onClick={() => go("listen")}>Listen</button>
          <button aria-pressed={mode === "make"} onClick={() => go("make")}>Make</button>
        </div>
        <DeckDot deck={deck} />
      </Head>
      {deck === "loading" && <div className={s.progress}><i style={{ width: `${ready}%` }} /></div>}
      {(deck === "closed" || deck === "sharing") && <DeckSteps deck={deck} setDeck={setDeck} setReady={setReady} />}
      {mode === "listen" ? (
        <>
          <HearBar hear={hear} setHear={setHear} disabled={deck !== "ready"} />
          <Lanes
            st={laneState(hear)} focus={focus} bar={bar} onSeek={seek} catching={catching} loop={loop} disabled={deck !== "ready"}
            onLoop={(x) => setLoop(loop?.from === x.from ? null : x)}
            overlay={(id) => id === focus && deck === "ready" ? (
              <Notes notes={notes.filter((x) => x.part === id)} open={open} setOpen={(n) => { setOpen(n); setAsking(false); }}
                bar={bar} asking={asking} setAsking={(a) => { setAsking(a); setOpen(null); }} partName={solo.name}
                section={secName(sectionAt(bar))} onAsk={ask} onSeek={seek} onMake={() => go("make")} lastLane={d.parts[d.parts.length - 1].id === id} />
            ) : null}
          />
        </>
      ) : (
        <div className={s.room}>
          <section className={s.synth}>
            <p className={s.who}>{solo.name} alone, {secName(sec)}, {clock(sec.from, d.track.bpm)}–{clock(sec.to, d.track.bpm)}{loop ? ", looping" : ""}</p>
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
          <MentorColumn notes={notes} onAsk={ask} onSeek={seek} bar={bar} partName={solo.name} />
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

/** The Mentor on the map: each question is a small dot above the focused part's clips at its bar
 *  (questions within 3% of the track share one slightly larger dot; hover shows the question).
 *  The open dot hangs a short chat thread below the lane, joined by a leader, on the side away
 *  from the playhead, so it never covers the part it talks about or the playhead. */
function Notes({ notes, open, setOpen, bar, asking, setAsking, partName, section, onAsk, onSeek, onMake, lastLane }: {
  lastLane: boolean; notes: Note[]; open: number | null; setOpen: (n: number | null) => void; bar: number;
  asking: boolean; setAsking: (a: boolean) => void; partName: string; section: string;
  onAsk: (q: string) => void; onSeek: (b: number) => void; onMake: () => void;
}) {
  const { d, pct } = useD();
  const gap = d.track.bars * 0.03;
  const groups: Group[] = [];
  for (const x of [...notes].sort((a, b) => a.bar - b.bar)) {
    const g = groups[groups.length - 1];
    if (g && x.bar - g.bar < gap) g.notes.push(x); else groups.push({ bar: x.bar, notes: [x] });
  }
  const openGroup = groups.find((g) => g.notes.some((x) => x.n === open));
  const askLeft = bar > d.track.bars * 0.1;
  const anchor = asking ? bar : openGroup?.bar;
  const px = (b: number) => ((b - 1) / d.track.bars) * TIMELINE_PX;
  const below = !lastLane;
  const W = 420;
  const cardPos = (at: number): CSSProperties => {
    const off = below ? 0 : 20;
    const room = px(at) + off + W <= TIMELINE_PX;
    const crosses = at < bar && px(at) + off + W >= px(bar);
    const left = room && !crosses ? `calc(${pct(at)} + ${off}px)` : `max(0px, calc(${pct(at)} + ${below ? 14 : -8}px - ${W}px))`;
    return { left, top: below ? "calc(100% + 10px)" : 5 };
  };
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {groups.map((g) => (
        <button key={g.bar} className={s.dot2} data-open={openGroup === g ? "" : undefined} data-many={g.notes.length > 1 ? "" : undefined}
          style={{ left: `calc(${pct(g.bar)} + 7px)` }}
          onClick={() => setOpen(openGroup === g ? null : g.notes[0].n)}
          title={g.notes.map((x) => x.q).join("\n")}
          aria-label={g.notes.length === 1 ? `Question at bar ${g.bar}: ${g.notes[0].q}` : `${g.notes.length} questions near bar ${g.bar}`} aria-expanded={openGroup === g} />
      ))}
      {!(asking || openGroup) && <button className={s.askBtn} aria-expanded={asking}
        style={{ left: askLeft ? `calc(${pct(bar)} - 8px)` : `calc(${pct(bar)} + 8px)`, transform: askLeft ? "translateX(-100%)" : undefined }}
        onClick={() => setAsking(!asking)}>
        {notes.length === 0 ? `+ Ask about the ${partName.toLowerCase()} here` : "+ Ask"}
      </button>}
      {anchor !== undefined && (asking || openGroup) && (
        <>
          {below && <i className={s.leader} style={{ left: `calc(${pct(anchor)} + 7px)`, top: asking ? "calc(100% - 4px)" : 14 }} aria-hidden />}
          <div className={s.card} style={cardPos(anchor)} role="dialog" aria-label={openGroup ? `Mentor at bar ${openGroup.bar}` : "Ask the Mentor"}>
            <div className={s.cardHead}>
              <span className={s.ctx}>{openGroup ? `Mentor, at bar ${openGroup.bar}` : `Ask about the ${partName.toLowerCase()} at bar ${bar}`}</span>
              <button className={s.x} onClick={() => { setOpen(null); setAsking(false); }} aria-label="Close">×</button>
            </div>
            {openGroup ? (
              <>
                <div className={s.cardThread} ref={(el) => { el?.querySelector("[data-current]")?.scrollIntoView({ block: "start" }); }}>
                  {openGroup.notes.map((x) => <Turn key={x.n} x={x} lines={3} onSeek={onSeek} current={x.n === open} />)}
                </div>
                <Composer placeholder={`Reply about bar ${openGroup.bar}…`} onAsk={onAsk} />
                <button className={s.makeText} onClick={onMake}>Make a {partName.toLowerCase()} like this →</button>
              </>
            ) : (
              <>
                <Composer placeholder={`What's the ${partName.toLowerCase()} doing here?`} onAsk={onAsk} autoFocus />
                <p className={s.facts}>The Mentor knows: {partName} alone, {section}, bar {bar}; pitch, timing and loudness. Not tone.</p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** One exchange: your question right-aligned in a light bubble with a "bar N" tag that jumps the
 *  playhead there; the Mentor's answer left as plain text, then the measured facts. */
function Turn({ x, lines, onSeek, current }: { x: Note; lines: number; onSeek: (b: number) => void; current?: boolean }) {
  return (
    <div className={s.turn} data-current={current ? "" : undefined}>
      <div className={s.mine}>
        <p className={s.bubble}>{x.q}</p>
        <button className={s.barTag} onClick={() => onSeek(x.bar)} aria-label={`Jump to bar ${x.bar}`}>bar {x.bar}</button>
      </div>
      <Answer text={x.a} lines={lines} />
      {x.tags && <p className={s.facts}>{x.tags.join(" · ")}</p>}
    </div>
  );
}

/** Chat input: a textarea that grows to 4 lines; Enter sends, Shift+Enter is a new line; the send
 *  arrow sits inside on the right, dimmed until there's text. */
function Composer({ placeholder, onAsk, autoFocus }: { placeholder: string; onAsk: (q: string) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 4 * 20 + 18)}px`;
  }, [q]);
  const send = () => { if (q.trim()) { onAsk(q.trim()); setQ(""); } };
  return (
    <form className={s.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <textarea ref={ref} className={s.ask} name="question" rows={1} autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
        placeholder={placeholder} aria-label="Ask the Mentor" aria-describedby="composer-hint" autoFocus={autoFocus} />
      <button type="submit" className={s.send} disabled={!q.trim()} aria-label="Send">↑</button>
      <span id="composer-hint" hidden>Enter sends, Shift+Enter adds a line</span>
    </form>
  );
}

function MentorColumn({ notes, onAsk, onSeek, bar, partName }: {
  notes: Note[]; onAsk: (q: string) => void; onSeek: (b: number) => void; bar: number; partName: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  // A chat opens at its latest exchange.
  useLayoutEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [notes.length]);
  return (
    <aside className={s.mentorCol} aria-label="Mentor">
      <span className={s.ctx}>Mentor, on the {partName.toLowerCase()} at bar {bar}</span>
      <div className={s.list} ref={list}>
        {notes.length === 0 && <p className={s.facts}>No questions yet. Ask about the {partName.toLowerCase()}: the answer is also pinned at bar {bar} on the map.</p>}
        {[...notes].sort((a, b) => a.n - b.n).map((x) => <Turn key={x.n} x={x} lines={6} onSeek={onSeek} />)}
      </div>
      <div className={s.askBar}><Composer placeholder={`Ask about the ${partName.toLowerCase()}…`} onAsk={onAsk} /></div>
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
