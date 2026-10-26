"use client";

// The Lab, Make mode (S3 Make + S4 Save, B7–B10; design lab-handoff.md §Make, final-make*.png;
// L157, L158, L161, L172–L175, T85, T87, T98). The focus part loops from memory; "Mine" is Six AM's
// own synth (a preset and six knobs) playing the part's estimated notes over the loop, in sync and
// at the same loudness, and A/B switches between them. The part is read off the main thread (a
// worker gets a copy and zeroes it, keeping only numbers); "Suggest settings" (local patch matching)
// places gold ticks and never turns a knob; "Save to library" keeps the preset, knob values and note
// pattern, never audio (L143). The state lives in useMake, held by the Lab, so the Listen/Make
// switch keeps it (T87).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { HATS_ROW, KICK_ROW, bandActivity, blocksFromActivity, laneBlocks } from "@/lib/lab/activity";
import type { PartName } from "@/lib/lab/live";
import type { LabTransport, LoopState } from "@/lib/lab/transport";
import { msToBar } from "@/lib/lab/timing";
import { clockMs, type LabPart, type LabSection } from "@/lib/lab/view";
import { suggestLine, movesTo } from "@/lib/make/coach";
import type { PartReading } from "@/lib/make/from-part";
import { gainToLevel } from "@/lib/make/level";
import { MakeClient } from "@/lib/make/make-client";
import { suggestName, suggestTags } from "@/lib/make/library";
import { MACRO_IDS, MACRO_SPECS, MAKE_PRESETS, MAKE_PRESET_IDS, macroWord, type MacroId, type Macros, type MakePresetId } from "@/lib/make/presets";
import { ApiError, mentorApi } from "@/lib/mentor/client";
import { partNoun, type LabMake } from "@/lib/mentor/lab";
import type { Scale } from "@/lib/synths/theory";
import { Composer, Turn, type ThreadTurn } from "./mentor-thread";
import s from "./lab.module.css";

type Reading = { loopKey: string; r: PartReading; levelDb: number; samples: number; rate: number };
type ReadState = "idle" | "reading" | "ready" | "nonotes" | "error";
/** A loop Stable Audio made from the owner's words (L157), playing as Mine instead of the synth. */
type WordsLoop = { text: string };

const loopKeyOf = (l: LoopState | null) => (l?.state === "memory" ? `${Math.round(l.startMs)}-${Math.round(l.endMs)}` : null);

export type MakeOpts = {
  tr: RefObject<LabTransport | null>;
  active: boolean;
  focus: PartName;
  loop: LoopState | null;
  bpm: number;
  keyName: string;
  scale: string;
  code: string;
  title: string;
  url: string;
};

/** Everything Make keeps while you switch to Listen and back (T87). */
export function useMake(o: MakeOpts) {
  const client = useRef<MakeClient | null>(null);
  const { tr } = o;
  const [preset, setPresetS] = useState<MakePresetId>("round-sub");
  const [macros, setMacros] = useState<Macros>(MAKE_PRESETS["round-sub"].macros);
  const [ticksS, setTicks] = useState<Macros | null>(null);
  const presetRef = useRef(preset);
  useEffect(() => { presetRef.current = preset; }, [preset]);
  const [ab, setAb] = useState<"a" | "b">("a");
  const [readingS, setReading] = useState<Reading | null>(null);
  // What was read for which loop: a state belongs to one loop (a new loop starts over).
  const [read, setRead] = useState<{ loopKey: string; state: ReadState; error?: string } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [mineKeyS, setMineKey] = useState<string | null>(null); // what Mine plays now (loop|sound)
  const [wordsS, setWords] = useState<WordsLoop & { loopKey: string } | null>(null);
  const [wordsState, setWordsState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const [name, setName] = useState<string | null>(null); // null = the suggested name
  const [savedS, setSaved] = useState<{ state: "idle" | "saving" | "saved" | "error"; text?: string; key: string }>({ state: "idle", key: "" });
  const renderMs = useRef<number | null>(null);
  const isBass = o.focus === "bass";
  const loopKey = loopKeyOf(o.loop);
  const scale: Scale | null = o.scale === "major" || o.scale === "minor" ? o.scale : null;
  // Everything below belongs to the loop in memory now; the transport drops Mine with its loop.
  const reading = readingS && readingS.loopKey === loopKey ? readingS : null;
  const readState: ReadState = read && read.loopKey === loopKey ? read.state : "idle";
  const readError = read?.error ?? null;
  const mineKey = mineKeyS && loopKey && mineKeyS.startsWith(`${loopKey}|`) ? mineKeyS : null;
  const words = wordsS && wordsS.loopKey === loopKey ? wordsS : null;
  const ticks = reading ? ticksS : null;

  useEffect(() => () => { client.current?.stop(); client.current = null; }, []);
  const cl = () => (client.current ??= new MakeClient());

  const suggest = useCallback(async (r: Reading, p: MakePresetId, start?: Macros) => {
    setSuggesting(true);
    try {
      const res = await cl().suggest({ reading: r.r, preset: p, bpm: o.bpm, start });
      console.info(`[make] suggest ${p}: ${res.suggestion.renders} renders in ${res.ms} ms, distance ${res.suggestion.distance.toFixed(2)} (preset ${res.suggestion.presetDistance.toFixed(2)})`);
      setTicks(res.suggestion.macros);
    } catch (e) {
      console.warn("[make] suggest failed", e);
    } finally {
      setSuggesting(false);
    }
  }, [o.bpm]);

  // Read the looped part once it's in memory (bass only): a copy goes to the worker, which zeroes it.
  const readFor = read?.loopKey ?? null;
  const startRead = useCallback((loopKey: string) => {
    const held = tr.current?.loopPart(1);
    if (!held) return;
    if (!o.keyName || !scale) { setRead({ loopKey, state: "error", error: "This track has no key yet, so Make can't place the notes." }); return; }
    setRead({ loopKey, state: "reading" });
    setTicks(null);
    const left = held.left.slice(), right = held.right.slice();
    const samples = left.length, rate = held.rate;
    cl().read({ left, right, rate, bpm: o.bpm, key: o.keyName, scale }).then((res) => {
      console.info(`[make] read in ${res.ms} ms: ${res.reading ? `${res.reading.pattern.bars}-bar pattern, ${res.reading.pattern.notes.length} notes, confidence ${res.reading.pattern.confidence}, offset ${res.reading.pattern.offsetMs} ms` : "no notes"}`);
      if (!res.reading) { setRead({ loopKey, state: "nonotes" }); return; }
      const r: Reading = { loopKey, r: res.reading, levelDb: res.levelDb, samples, rate };
      setReading(r);
      setRead({ loopKey, state: "ready" });
      void suggest(r, presetRef.current);
    }, (e) => setRead({ loopKey, state: "error", error: `Make couldn't read the bass: ${e instanceof Error ? e.message : String(e)}` }));
  }, [o.keyName, scale, o.bpm, tr, suggest]);
  useEffect(() => {
    if (!o.active || !isBass || !loopKey || readFor === loopKey) return;
    const t = setTimeout(() => startRead(loopKey), 0);
    return () => clearTimeout(t);
  }, [o.active, isBass, loopKey, readFor, startRead]);

  // Mine: re-render on every knob or preset change (debounced), and swap it in, in sync.
  useEffect(() => {
    if (!o.active || !reading || words) return;
    const key = `${reading.loopKey}|${preset}|${MACRO_IDS.map((id) => macros[id].toFixed(3)).join(",")}`;
    if (key === mineKey) return;
    const t = setTimeout(() => {
      const t0 = performance.now();
      cl().render({ reading: reading.r, preset, macros, bpm: o.bpm, rate: reading.rate, levelDb: reading.levelDb, samples: reading.samples }).then(({ res, stale }) => {
        if (stale || loopKeyOf(tr.current?.state.loop ?? null) !== reading.loopKey) return;
        renderMs.current = Math.round(performance.now() - t0);
        tr.current?.setMine(res);
        setMineKey(key);
      }, (e) => console.warn("[make] render failed", e));
    }, 60);
    return () => clearTimeout(t);
  }, [o.active, reading, preset, macros, words, mineKey, o.bpm, tr]);

  const setPreset = useCallback((p: MakePresetId) => {
    setWords(null);
    setPresetS(p);
    setMacros(MAKE_PRESETS[p].macros);
    setTicks(null);
    if (reading) void suggest(reading, p);
  }, [reading, suggest]);
  const setMacro = useCallback((id: MacroId, v: number) => setMacros((m) => (m[id] === v ? m : { ...m, [id]: v })), []);

  // "Describe a bass in words…": Stable Audio, from the words and the track's tempo and key only.
  const fromWords = async (text: string) => {
    if (!reading || !scale) return;
    setWordsState({ busy: true, error: null });
    try {
      const res = await fetch("/api/loops/generate", {
        method: "POST",
        headers: { "content-type": "application/json", "x-access-code": o.code },
        body: JSON.stringify({ analysis: { bpm: o.bpm, key: o.keyName, scale }, bars: 4, words: text, tz: new Date().getTimezoneOffset() }),
      }).catch(() => null);
      if (!res) throw new Error("No connection. Check your internet and try again.");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 429 ? (data.error ?? "That's today's limit for AI loops.") : res.status === 503 ? "AI loops aren't set up on this server yet." : (data.error ?? "The AI loop service failed. Try again in a minute."));
      const bytes = Uint8Array.from(atob(data.audio.base64), (c) => c.charCodeAt(0)).buffer;
      const buf = await new OfflineAudioContext(2, 1, reading.rate).decodeAudioData(bytes);
      const left = buf.getChannelData(0).slice(), right = (buf.numberOfChannels > 1 ? buf.getChannelData(1) : buf.getChannelData(0)).slice();
      const g = gainToLevel(reading.levelDb, { left, right, rate: buf.sampleRate });
      for (let i = 0; i < left.length; i++) { left[i] *= g.gain; right[i] *= g.gain; }
      console.info(`[make] words loop: ${buf.duration.toFixed(2)} s, ${g.db} dB to match, est. $${data.costUsd}`);
      tr.current?.setMine({ left, right, rate: buf.sampleRate });
      setWords({ text, loopKey: reading.loopKey });
      setMineKey(`${reading.loopKey}|words|${text}`);
      setWordsState({ busy: false, error: null });
    } catch (e) {
      setWordsState({ busy: false, error: e instanceof Error ? e.message : String(e) });
    }
  };

  const suggested = suggestName("bass", preset, macros, o.title);
  const tags = useMemo(() => (scale && o.keyName ? suggestTags("bass", preset, o.keyName, scale, o.bpm, o.title) : []), [scale, preset, o.keyName, o.bpm, o.title]);
  // "Saved" belongs to the sound it saved: a change after saving makes a new sound to save.
  const soundKey = `${loopKey}|${preset}|${MACRO_IDS.map((id) => macros[id]).join(",")}`;
  const saved = savedS.key === soundKey || savedS.state === "saving" ? savedS : { state: "idle" as const, key: soundKey };
  const save = async () => {
    if (!reading || !scale || words) return;
    const key = soundKey;
    setSaved({ state: "saving", key });
    try {
      const snd = await mentorApi(o.code).addSound({
        name: (name ?? suggested).trim() || suggested, part: "bass", preset, macros,
        pattern: { bars: reading.r.pattern.bars, notes: reading.r.pattern.notes },
        key: o.keyName, scale, bpm: o.bpm, source: { title: o.title, url: o.url }, tags,
      });
      setSaved({ state: "saved", text: snd.name, key });
    } catch (e) {
      setSaved({ state: "error", text: e instanceof ApiError ? e.message : "Couldn't save. Try again.", key });
    }
  };

  return {
    isBass, preset, setPreset, macros, setMacro, ticks, ab, setAb, reading, readState, readError, suggesting,
    suggestAgain: () => { if (reading) void suggest(reading, preset, macros); },
    mineReady: mineKey !== null, words, wordsState, fromWords, clearWords: () => { setWords(null); setMineKey(null); },
    name: name ?? suggested, setName, tags, save, saved,
    /** What the Lab Mentor gets with a question asked in Make. */
    labMake: (isBass && !words ? { preset, macros, ticks } : null) as LabMake | null,
    debug: () => ({ preset, macros, ticks, ab, readState, mineKey, renderMs: renderMs.current, words: words?.text ?? null, pattern: reading?.r.pattern ?? null, levelDb: reading?.levelDb ?? null, features: reading?.r.features ?? null, saved }),
  };
}
export type MakeModel = ReturnType<typeof useMake>;

type RoomProps = {
  m: MakeModel;
  part: LabPart;
  loop: LoopState | null;
  section: LabSection | null;
  bpm: number;
  originSec: number;
  chords: (string | null)[];
  /** Every heard row (the four parts, then the drums' kick and hats bands). */
  levels: (number | null)[][] | null;
  heardMs: () => number;
  status: string;
  ready: boolean;
  playing: boolean;
  bar: number;
  turns: ThreadTurn[];
  onAsk: (q: string, bar: number) => void;
  onRetry: (id: string) => void;
  onSeek: (bar: number) => void;
  onLoopHere: () => void;
  busy: boolean;
  note: string | null;
};

export function MakeRoom(p: RoomProps) {
  const { m, part, loop } = p;
  const name = part.name.toLowerCase();
  const from = loop ? Math.round(msToBar(loop.startMs, p.bpm, p.originSec)) : null;
  const to = loop ? Math.round(msToBar(loop.endMs, p.bpm, p.originSec)) : null;
  const where = p.section ? `${p.section.label}${from !== null && to !== null && (from !== p.section.from || to !== p.section.to) ? `, bars ${from}–${to - 1}` : ""}` : null;
  const caption = loop
    ? `${part.name} alone, ${[where, `${clockMs(loop.startMs)}–${clockMs(loop.endMs)}`].filter(Boolean).join(", ")}, ${loop.state === "memory" ? "looping" : p.status || (p.playing ? "filling the loop…" : "the loop fills when you press Play")}`
    : `${part.name} alone`;
  return (
    <div className={s.room}>
      <section className={s.synth} aria-label={`Make a ${name}`}>
        <p className={s.who} aria-live="polite">{caption}</p>
        {loop && from !== null && to !== null
          ? <LoopStrip part={part} from={from} to={to} chords={p.chords} levels={p.levels} heardMs={p.heardMs} bpm={p.bpm} originSec={p.originSec} />
          : <div className={s.makeEmpty}><p>Make works on a loop of the part, held in memory while it plays.</p><button className={s.ghost} onClick={p.onLoopHere}>Loop this section</button></div>}
        {!m.isBass ? (
          <p className={s.makeQuiet}>Make is bass-only for now.</p>
        ) : (
          <SynthControls m={m} part={part} loop={loop} ready={p.ready} />
        )}
      </section>
      {m.isBass && <SaveBar m={m} />}
      <MentorRail turns={p.turns} part={part} bar={p.bar} onAsk={p.onAsk} onRetry={p.onRetry} onSeek={p.onSeek} busy={p.busy} note={p.note} />
    </div>
  );
}

function SynthControls({ m, part, loop, ready }: { m: MakeModel; part: LabPart; loop: LoopState | null; ready: boolean }) {
  const off = !!m.words || m.readState !== "ready";
  const moves = m.ticks ? movesTo(m.macros, m.ticks) : [];
  let line: React.ReactNode;
  if (!loop || loop.state !== "memory") line = <>Mentor: {ready ? "once the loop is in memory I'll read the bass's notes and suggest settings." : "press Play; once the loop is in memory I'll read the bass's notes."}</>;
  else if (m.readState === "reading") line = <>Reading the bass&apos;s notes…</>;
  else if (m.readState === "nonotes") line = <>No bass notes found in this loop. Loop a section where the bass plays.</>;
  else if (m.readState === "error") line = <>{m.readError}</>;
  else if (m.words) line = <>Mine is a loop Stable Audio made from your words and the track&apos;s tempo and key.<br /><span className={s.faintLine}>The knobs work on presets. Pick one to go back.</span></>;
  else if (!m.ticks) line = <>{m.suggesting ? `Measuring the bass against ${MAKE_PRESETS[m.preset].name}…` : "Mentor: press Suggest settings to compare this preset with the bass."}</>;
  else line = <>Mentor: {suggestLine(m.macros, m.ticks)}{moves.length > 0 && <><br /><span className={s.faintLine}>Gold ticks mark those.</span></>}</>;
  return (
    <>
      <PresetHead m={m} partName={part.name.toLowerCase()} />
      <div className={s.macros} data-off={off ? "" : undefined}>
        {MACRO_IDS.map((id) => (
          <Knob key={id} id={id} value={m.macros[id]} sug={m.ticks?.[id]} color={part.color} disabled={off} onChange={(v) => m.setMacro(id, v)} reset={MAKE_PRESETS[m.preset].macros[id]} />
        ))}
      </div>
      <div className={s.suggestRow}>
        <p className={s.suggest} aria-live="polite">{line}</p>
        {/* Suggest settings (L157, T85): local patch matching; it only moves the gold ticks. */}
        <button className={s.ghost} onClick={m.suggestAgain} disabled={off || m.suggesting} aria-describedby="suggest-hint">{m.suggesting ? "Suggesting…" : "Suggest settings"}</button>
        <span id="suggest-hint" hidden>Places gold ticks where the knobs come closest to the original; it never turns a knob</span>
      </div>
      <div className={s.checkRow}>
        <div className={s.abWrap}>
          <div className={s.ab} role="group" aria-label="Compare at the same loudness">
            <button aria-pressed={m.ab === "a"} onClick={() => m.setAb("a")}>A · Original {part.name.toLowerCase()}</button>
            <button aria-pressed={m.ab === "b"} onClick={() => m.setAb("b")} disabled={!m.mineReady} title={m.mineReady ? undefined : "Mine plays once the loop is read"}>B · Mine</button>
          </div>
          <span className={s.faint}>same loudness</span>
        </div>
      </div>
    </>
  );
}

/** The preset name opens a menu of tagged starting points; describing one in words is its last item (T85). */
function PresetHead({ m, partName }: { m: MakeModel; partName: string }) {
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  const current = m.words ? "From your words" : MAKE_PRESETS[m.preset].name;
  const canWords = m.readState === "ready";
  return (
    <div className={s.preset} ref={box}>
      <button className={s.presetName} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        aria-label={`Preset: ${current}. Change preset`}>{current} <span aria-hidden>▾</span></button>
      {open && (
        <div className={s.menu} role="menu" aria-label="Presets">
          {MAKE_PRESET_IDS.map((id) => (
            <button key={id} role="menuitemradio" aria-checked={!m.words && id === m.preset} className={s.menuItem}
              onClick={() => { setOpen(false); setAsking(false); if (m.words || id !== m.preset) m.setPreset(id); }}>
              <span className={s.menuCheck} aria-hidden>{!m.words && id === m.preset ? "✓" : ""}</span>
              <span>{MAKE_PRESETS[id].name}</span>
              <small>{MAKE_PRESETS[id].tags.join(" · ")}</small>
            </button>
          ))}
          <i className={s.menuRule} aria-hidden />
          <button role="menuitem" className={s.menuItem} disabled={!canWords} onClick={() => { setOpen(false); setAsking(true); }}>
            <span className={s.menuCheck} aria-hidden>{m.words ? "✓" : ""}</span>
            <span>Describe a {partName} in words…</span>
          </button>
        </div>
      )}
      {asking && (
        <form className={s.wordsForm} onSubmit={(e) => { e.preventDefault(); if (text.trim() && !m.wordsState.busy) void m.fromWords(text.trim()).then(() => setAsking(false)); }}>
          <input className={s.input} name="bass-words" autoComplete="off" autoFocus maxLength={160} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={`A ${partName} in your words: "short, rubbery, a bit dirty"`} aria-label={`Describe a ${partName} in words`} />
          <button type="submit" className={s.ghost} disabled={!text.trim() || m.wordsState.busy}>{m.wordsState.busy ? "Making… about 20 s" : "Make it"}</button>
          <button type="button" className={s.textBtn} onClick={() => setAsking(false)}>Cancel</button>
          <p className={s.facts}>{m.wordsState.error ?? "Stable Audio gets your words and the track's tempo and key, never its audio. One loop costs about $0.08."}</p>
        </form>
      )}
    </div>
  );
}

/** A 96 px knob (handoff §Make 5): 270° track at 25% white, value arc in the part's colour, a dot at
 *  zero, a gold tick at the suggestion. Drag up/down (Shift for fine), arrows, Page keys, Home/End;
 *  double-click goes back to the preset's value. */
function Knob({ id, value, sug, color, disabled, onChange, reset, size = 96 }: { id: MacroId; value: number; sug?: number; color: string; disabled: boolean; onChange: (v: number) => void; reset: number; size?: number }) {
  const spec = MACRO_SPECS[id];
  const drag = useRef<{ y: number; v: number } | null>(null);
  const a0 = -135, a = a0 + 270 * value, r = size / 2 - 6, c = size / 2;
  const pt = (deg: number, rr = r) => [c + rr * Math.sin((deg * Math.PI) / 180), c - rr * Math.cos((deg * Math.PI) / 180)];
  const [x0, y0] = pt(a0), [x1, y1] = pt(a), [xe, ye] = pt(135);
  const sa = sug !== undefined ? a0 + 270 * sug : null;
  const set = (v: number) => onChange(Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000);
  const word = macroWord(id, value);
  return (
    <div className={s.knob} role="slider" tabIndex={disabled ? -1 : 0} aria-label={spec.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      aria-valuetext={`${word}${sug !== undefined ? `, suggestion ${macroWord(id, sug)}` : ""}`} aria-disabled={disabled || undefined} title={spec.explain}
      onPointerDown={(e) => { if (disabled || e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { y: e.clientY, v: value }; }}
      onPointerMove={(e) => { const d = drag.current; if (!d) return; set(d.v + (d.y - e.clientY) / (e.shiftKey ? 720 : 180)); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onDoubleClick={() => { if (!disabled) set(reset); }}
      onKeyDown={(e) => {
        if (disabled) return;
        const step = e.shiftKey ? 0.1 : 0.01;
        const k: Record<string, number> = { ArrowUp: value + step, ArrowRight: value + step, ArrowDown: value - step, ArrowLeft: value - step, PageUp: value + 0.1, PageDown: value - 0.1, Home: 0, End: 1 };
        if (e.key in k) { e.preventDefault(); set(k[e.key]); }
      }}>
      <svg width={size} height={size} aria-hidden>
        <path d={`M${x0} ${y0} A${r} ${r} 0 1 1 ${xe} ${ye}`} fill="none" stroke="rgba(241,230,211,.25)" strokeWidth="2" strokeLinecap="round" />
        {value <= 0.005 && <circle cx={x0} cy={y0} r="2" fill={color} />}
        {value > 0.005 && <path d={`M${x0} ${y0} A${r} ${r} 0 ${a - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {sa !== null && (() => { const [p1, q1] = pt(sa, r + 5), [p2, q2] = pt(sa, r - 5); return <line x1={p1} y1={q1} x2={p2} y2={q2} stroke="#f2b134" strokeWidth="2.5" strokeLinecap="round" />; })()}
      </svg>
      <span>{spec.name}</span>
      <small>{word}</small>
    </div>
  );
}

/** The loop, zoomed (handoff §Make 3): chords, bar numbers, the part's clips (heard, else the map's
 *  estimate, faint), the playhead. Grows from 118 to 280 px with spare height. */
function LoopStrip({ part, from, to, chords, levels, heardMs, bpm, originSec }: { part: LabPart; from: number; to: number; chords: (string | null)[]; levels: (number | null)[][] | null; heardMs: () => number; bpm: number; originSec: number }) {
  const head = useRef<HTMLElement>(null);
  const len = to - from;
  useLayoutEffect(() => {
    let raf = 0;
    const tick = () => {
      const b = msToBar(heardMs(), bpm, originSec);
      const el = head.current;
      if (el) { const inside = b >= from && b < to; el.style.display = inside ? "" : "none"; if (inside) el.style.left = `${((b - from) / len) * 100}%`; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heardMs, bpm, originSec, from, to, len]);
  const pct = (b: number) => `${((b - from) / len) * 100}%`;
  const w = (a: number, b: number) => `${((b - a) / len) * 100}%`;
  const clip = (bl: { from: number; to: number }[]) => bl.filter((x) => x.to > from && x.from < to).map((x) => ({ from: Math.max(x.from, from), to: Math.min(x.to, to) }));
  // One row per sub-layer (the drums' kick and hats bands), else the part itself.
  const own = levels?.[["drums", "bass", "other", "vocals"].indexOf(part.id)] ?? [];
  const rows = part.subs.length
    ? part.subs.map((x, i) => ({ label: `${x.name}`, ...blocksFromActivity(bandActivity(levels?.[i === 0 ? KICK_ROW : HATS_ROW], own), x.blocks) }))
    : [{ label: part.name.toLowerCase(), ...laneBlocks(own, part.blocks) }];
  const cells = chords.map((c, i) => ({ c, at: 1 + i * 8 })).filter((x) => x.at + 8 > from && x.at < to && x.c !== null);
  const step = len > 32 ? 8 : 4;
  return (
    <div className={s.loopStrip} aria-label={`${part.name} alone, bars ${from} to ${to - 1}`}>
      <div className={s.lsRow} data-kind="chords">
        <span className={s.lsLabel}>chords est.</span>
        <div className={s.lsTrack}>{cells.map((x) => <span key={x.at} className={s.lsChord} style={{ left: pct(Math.max(from, x.at)) }}>{x.c || "–"}</span>)}</div>
      </div>
      <div className={s.lsRow} data-kind="bars">
        <span className={s.lsLabel}>bars</span>
        <div className={s.lsTrack}>{Array.from({ length: Math.ceil(len / step) }, (_, i) => from + i * step).map((b) => <span key={b} className={s.lsNum} style={{ left: pct(b) }}>{b}</span>)}</div>
      </div>
      {rows.map((row) => (
        <div key={row.label} className={s.lsRow}>
          <span className={s.lsLabel}>{row.label}</span>
          <div className={s.lsTrack}>
            {clip(row.heard).map((x) => <span key={`h${x.from}`} className={s.lsClip} style={{ left: pct(x.from), width: w(x.from, x.to), background: part.color }} />)}
            {clip(row.estimate).map((x) => <span key={`e${x.from}`} className={s.lsClip} data-est="" style={{ left: pct(x.from), width: w(x.from, x.to), borderColor: part.color }} />)}
          </div>
        </div>
      ))}
      <div className={s.lsHeadBox} aria-hidden><i ref={head} className={s.zoomHead} /></div>
    </div>
  );
}

function SaveBar({ m }: { m: MakeModel }) {
  // Saved once: the button rests until the sound changes (a change is a new sound to save).
  const can = m.readState === "ready" && !m.words && m.saved.state !== "saving" && m.saved.state !== "saved";
  return (
    <div className={s.saveBar}>
      <label className={s.saveLabel} htmlFor="save-name">Name</label>
      <input id="save-name" name="sound-name" autoComplete="off" className={s.input} value={m.name} maxLength={60} onChange={(e) => m.setName(e.target.value)} disabled={!!m.words} />
      <span className={s.facts} title={m.tags.join(" · ")}>{m.tags.join(" · ")}</span>
      <span className={s.saved} role="status">{m.saved.state === "saved" ? "Saved to your library" : m.saved.state === "error" ? m.saved.text : m.words ? "A loop from words can't be saved yet" : ""}</span>
      <button className={s.gold} onClick={() => void m.save()} disabled={!can}>{m.saved.state === "saving" ? "Saving…" : "Save to library"}</button>
    </div>
  );
}

/** Make's Mentor rail (handoff §Make 9): the same per-track lab thread as Listen, in order, newest at the bottom. */
function MentorRail({ turns, part, bar, onAsk, onRetry, onSeek, busy, note }: { turns: ThreadTurn[]; part: LabPart; bar: number; onAsk: (q: string, bar: number) => void; onRetry: (id: string) => void; onSeek: (bar: number) => void; busy: boolean; note: string | null }) {
  const list = useRef<HTMLDivElement>(null);
  const last = turns.at(-1);
  useLayoutEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [turns.length, last?.answer, last?.error]);
  const noun = partNoun(part.id);
  return (
    <aside className={s.mentorCol} aria-label="Mentor">
      <span className={s.ctx}>Mentor, on {noun} at bar {bar}</span>
      <div className={s.list} ref={list}>
        {turns.length === 0 && <p className={s.facts}>No questions yet. Ask about {noun}: the answer is also pinned at bar {bar} on the map.</p>}
        {turns.map((x) => <Turn key={x.id} x={x} lines={6} onSeek={onSeek} onRetry={() => onRetry(x.id)} />)}
      </div>
      <div className={s.askBar}>
        <Composer placeholder={`Ask about ${noun}…`} onAsk={(q) => onAsk(q, bar)} disabled={busy} />
        {note && <p className={s.facts}>{note}</p>}
      </div>
    </aside>
  );
}
