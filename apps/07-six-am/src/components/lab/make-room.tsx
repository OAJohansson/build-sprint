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
import { suggestLine, movesTo, ticksMoved } from "@/lib/make/coach";
import type { PartReading } from "@/lib/make/from-part";
import type { MakeNote } from "@/lib/make/render";
import { gainToLevel } from "@/lib/make/level";
import { notesForLoop } from "@/lib/make/pattern";
import { gateNotes } from "@/lib/make/gate";
import { MakeClient } from "@/lib/make/make-client";
import { saveAction, soundId, suggestName, suggestTags, type LibrarySound } from "@/lib/make/library";
import { MACRO_IDS, MAKE_PRESETS, MAKE_PRESET_IDS, type MacroId, type Macros, type MakePresetId } from "@/lib/make/presets";
import { ApiError, mentorApi } from "@/lib/mentor/client";
import { noteName, partNoun, type LabMake } from "@/lib/mentor/lab";
import type { Scale } from "@/lib/synths/theory";
import { Composer, Turn, useEdgeFades, type ThreadTurn } from "./mentor-thread";
import { Knob } from "@/components/ui/knob";
import s from "./lab.module.css";

type Reading = { loopKey: string; r: PartReading; levelDb: number; active: boolean[]; samples: number; rate: number };
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
  // The last sound saved or loaded here (S5-1): a rename of it is a PATCH, not a second sound.
  const [last, setLast] = useState<{ id: string; sound: string; name: string } | null>(null);
  const [saveState, setSaveState] = useState<{ state: "idle" | "saving" | "error"; text?: string }>({ state: "idle" });
  // S5-2: this track's sounds in the library, for one quiet line in Make.
  const [sounds, setSounds] = useState<LibrarySound[]>([]);
  // S3-2: which knob values the ticks were worked out from, and what the last run moved.
  const [ticksFor, setTicksFor] = useState<string | null>(null);
  const [moved, setMoved] = useState<string | null>(null);
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

  const suggest = useCallback(async (r: Reading, p: MakePresetId, start?: Macros, before?: Macros | null) => {
    setSuggesting(true);
    const t0 = performance.now();
    try {
      const res = await cl().suggest({ reading: r.r, preset: p, bpm: o.bpm, start });
      console.info(`[make] suggest ${p}: ${res.suggestion.renders} renders in ${res.ms} ms (${Math.round(performance.now() - t0)} ms round trip), distance ${res.suggestion.distance.toFixed(2)} (preset ${res.suggestion.presetDistance.toFixed(2)})`);
      setTicks(res.suggestion.macros);
      setTicksFor(soundId(p, start ?? MAKE_PRESETS[p].macros));
      setMoved(before === undefined ? null : ticksMoved(before, res.suggestion.macros));
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
      const r: Reading = { loopKey, r: res.reading, levelDb: res.levelDb, active: res.active, samples, rate };
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
      cl().render({ reading: reading.r, active: reading.active, preset, macros, bpm: o.bpm, rate: reading.rate, levelDb: reading.levelDb, samples: reading.samples }).then(({ res, stale }) => {
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
    setMoved(null);
    if (reading) void suggest(reading, p);
  }, [reading, suggest]);

  // S5-2: the sounds already made from this track (numbers only), and loading one back.
  useEffect(() => {
    if (!o.code || !o.url) return;
    let live = true;
    mentorApi(o.code).sounds({ source: o.url, part: "bass" }).then((xs) => { if (live) setSounds(xs); }, () => { /* the line just stays away */ });
    return () => { live = false; };
  }, [o.code, o.url]);
  const loadSound = (x: LibrarySound) => {
    setWords(null);
    setPresetS(x.preset);
    setMacros(x.macros);
    setName(x.name);
    setLast({ id: x.id, sound: soundId(x.preset, x.macros), name: x.name });
    setTicks(null);
    setMoved(null);
    if (reading) void suggest(reading, x.preset);
  };
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
  // S5-1: Save posts a new sound, renames the one saved here (PATCH), or rests when it's saved.
  const sound = soundId(preset, macros);
  // A new sound after a save starts from the suggested name again, not the saved one's.
  const nameField = name === null || (last && last.sound !== sound && name === last.name) ? suggested : name;
  const nameNow = nameField.trim() || suggested;
  const action = saveAction({ sound, name: nameNow }, last);
  const savedAs = last && last.sound === sound ? last.name : null;
  const save = async () => {
    if (!reading || !scale || words || action.kind === "none") return;
    setSaveState({ state: "saving" });
    try {
      const api = mentorApi(o.code);
      const snd = action.kind === "patch"
        ? await api.patchSound(action.id, { name: nameNow })
        : await api.addSound({
          name: nameNow, part: "bass", preset, macros,
          pattern: { bars: reading.r.pattern.bars, notes: reading.r.pattern.notes },
          key: o.keyName, scale, bpm: o.bpm, source: { title: o.title, url: o.url }, tags,
        });
      setLast({ id: snd.id, sound, name: snd.name });
      setName(snd.name);
      setSounds((xs) => [snd, ...xs.filter((x) => x.id !== snd.id)]);
      setSaveState({ state: "idle" });
    } catch (e) {
      setSaveState({ state: "error", text: e instanceof ApiError ? e.message : "Couldn't save. Try again." });
    }
  };
  const saved = { state: saveState.state, text: saveState.text, savedAs, action: action.kind };
  // The loop's notes as read, repeated over the loop (S3-5): drawn in the strip's bass row.
  // …only in the bars the original plays in, as Mine plays them (S3-N2).
  const loopNotes = useMemo(() => (reading ? gateNotes(notesForLoop(reading.r.pattern, reading.r.loopSteps).map((n, i, all) => ({ ...n, dur: Math.min(n.dur, reading.r.pattern.notes.find((x) => x.step === n.step % (reading.r.pattern.bars * 16))?.dur ?? n.dur, (all[i + 1]?.step ?? reading.r.loopSteps) - n.step) })), reading.active) : null), [reading]);

  return {
    isBass, preset, setPreset, macros, setMacro, ticks, ab, setAb, reading, readState, readError, suggesting,
    suggestAgain: () => { if (reading) void suggest(reading, preset, macros, ticks); },
    /** The ticks were worked out from exactly these knobs: nothing new to suggest (S3-2). */
    suggestedNow: !!ticks && ticksFor === sound, moved,
    sounds, loadSound, loopNotes, loopSteps: reading?.r.loopSteps ?? null,
    mineReady: mineKey !== null, words, wordsState, fromWords, clearWords: () => { setWords(null); setMineKey(null); },
    name: nameField, setName, tags, save, saved,
    /** What the Lab Mentor gets with a question asked in Make. */
    labMake: (isBass && !words ? { preset, macros, ticks } : null) as LabMake | null,
    debug: () => ({ preset, macros, ticks, ab, readState, mineKey, renderMs: renderMs.current, active: reading?.active ?? null, sounds: sounds.map((x) => x.name), words: words?.text ?? null, pattern: reading?.r.pattern ?? null, levelDb: reading?.levelDb ?? null, features: reading?.r.features ?? null, saved }),
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
  /** S3-4: from Drums, Other or Vocals in Make, focus the bass. */
  onBass: () => void;
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
    ? `${part.name} alone, ${[where, `${clockMs(loop.startMs)}–${clockMs(loop.endMs)}`].filter(Boolean).join(", ")}, ${loop.state === "memory" ? "looping" : p.playing ? `filling the loop… ${loop.etaS ?? ""} s`.replace(/ {2}s$/, "") : "the loop fills when you press Play"}`
    : `${part.name} alone`;
  return (
    <div className={s.room}>
      <section className={s.synth} aria-label={`Make a ${name}`}>
        <p className={s.who} aria-live="polite">{caption}</p>
        {loop && from !== null && to !== null
          ? <LoopStrip part={part} from={from} to={to} chords={p.chords} levels={p.levels} heardMs={p.heardMs} bpm={p.bpm} originSec={p.originSec} notes={m.isBass ? m.loopNotes : null} steps={m.loopSteps} />
          : <div className={s.makeEmpty}><p>Make works on a loop of the part, held in memory while it plays.</p><button className={s.ghost} onClick={p.onLoopHere}>Loop this section</button></div>}
        {!m.isBass ? (
          <p className={s.makeQuiet}>Make is bass-only for now. <button className={s.makeText} onClick={p.onBass}>Make a bass instead</button></p>
        ) : (
          <SynthControls m={m} part={part} loop={loop} ready={p.ready} playing={p.playing} />
        )}
      </section>
      {m.isBass && <SaveBar m={m} />}
      <MentorRail turns={p.turns} part={part} bar={p.bar} onAsk={p.onAsk} onRetry={p.onRetry} onSeek={p.onSeek} busy={p.busy} note={p.note} />
    </div>
  );
}

/**
 * Until the knobs are live, what's happening and how long (owner bug, 27 Oct: the bass looped and
 * nothing said Make was still waiting for it). Null once Mine can be made.
 */
function waitLine(m: MakeModel, loop: LoopState | null, ready: boolean, playing: boolean): string | null {
  if (m.readState === "ready" || m.words) return null;
  if (!loop) return "Loop a section first: Make builds your bass on a loop of the song.";
  const lenS = Math.round((loop.endMs - loop.startMs) / 1000);
  if (loop.state === "filling") {
    if (loop.laps >= 2) return "The loop isn't filling: the part splitter is running behind on this Mac. Loop a shorter section, or close other tabs, then press Play again.";
    if (!playing) return `Press Play. The loop fills from the song first (about ${lenS + 7} s), then your bass appears here.`;
    return `Filling the loop… ${loop.etaS ?? lenS} s, then your bass appears here.`;
  }
  if (m.readState === "reading" || m.readState === "idle") return "Reading the bass's notes… a second.";
  if (m.readState === "nonotes") return "No bass notes in this loop. Loop a section where the bass plays.";
  return m.readError ?? (ready ? null : "Press Play.");
}

function SynthControls({ m, part, loop, ready, playing }: { m: MakeModel; part: LabPart; loop: LoopState | null; ready: boolean; playing: boolean }) {
  const off = !!m.words || m.readState !== "ready";
  const wait = waitLine(m, loop, ready, playing);
  const moves = m.ticks ? movesTo(m.macros, m.ticks) : [];
  let line: React.ReactNode;
  if (wait) line = <span className={s.faintLine}>The knobs and B · Mine come alive once the loop is in memory.</span>;
  else if (m.words) line = <>Mine is a loop Stable Audio made from your words and the track&apos;s tempo and key.<br /><span className={s.faintLine}>The knobs work on presets. Pick one to go back.</span></>;
  else if (!m.ticks) line = <>{m.suggesting ? `Measuring the bass against ${MAKE_PRESETS[m.preset].name}…` : "Mentor: press Suggest settings to compare this preset with the bass."}</>;
  else line = <>Mentor: {suggestLine(m.macros, m.ticks)}{(moves.length > 0 || m.moved) && <><br /><span className={s.faintLine}>{m.moved ?? "Gold ticks mark those."}</span></>}</>;
  return (
    <>
      <PresetHead m={m} partName={part.name.toLowerCase()} />
      <div className={s.macros} data-off={off ? "" : undefined}>
        {wait && <p className={s.makeWait} role="status">{wait}</p>}
        {MACRO_IDS.map((id) => (
          <Knob key={id} id={id} value={m.macros[id]} sug={m.ticks?.[id]} color={part.color} disabled={off} onChange={(v) => m.setMacro(id, v)} reset={MAKE_PRESETS[m.preset].macros[id]} size={84} />
        ))}
      </div>
      <div className={s.suggestRow}>
        <p className={s.suggest} aria-live="polite">{line}</p>
        {/* Suggest settings (L157, T85): local patch matching; it only moves the gold ticks. */}
        <button className={s.ghost} onClick={m.suggestAgain} disabled={off || m.suggesting || m.suggestedNow} aria-describedby="suggest-hint">{m.suggesting ? "Suggesting…" : m.suggestedNow ? "Suggested" : "Suggest settings"}</button>
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
  const [menuMax, setMenuMax] = useState<number | undefined>(undefined);
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
      <div className={s.presetRow}>
        <button className={s.presetName} aria-haspopup="menu" aria-expanded={open} onClick={(e) => {
          // T110: the menu (presets, Your sounds, words) scrolls inside the synth column, never under the save bar.
          const col = box.current?.closest("section")?.getBoundingClientRect();
          setMenuMax(col ? Math.max(180, Math.round(col.bottom - e.currentTarget.getBoundingClientRect().bottom - 16)) : undefined);
          setOpen(!open);
        }}
          aria-label={`Preset: ${current}. Change preset`}>{current} <span aria-hidden>▾</span></button>
      </div>
      {open && (
        <div className={s.menu} role="menu" aria-label="Presets" style={{ maxHeight: menuMax }}>
          {MAKE_PRESET_IDS.map((id) => (
            <button key={id} role="menuitemradio" aria-checked={!m.words && id === m.preset} className={s.menuItem}
              onClick={() => { setOpen(false); setAsking(false); if (m.words || id !== m.preset) m.setPreset(id); }}>
              <span className={s.menuCheck} aria-hidden>{!m.words && id === m.preset ? "✓" : ""}</span>
              <span>{MAKE_PRESETS[id].name}</span>
              <small>{MAKE_PRESETS[id].tags.join(" · ")}</small>
            </button>
          ))}
          {/* T110 (S5-2, F3): every sound saved from this track, newest first; one click loads it. */}
          {m.sounds.length > 0 && (
            <>
              <i className={s.menuRule} aria-hidden />
              <span className={s.menuHead}>Your sounds</span>
              <div className={s.menuSounds} role="group" aria-label="Your sounds from this track">
                {m.sounds.map((x) => (
                  <button key={x.id} role="menuitem" className={s.menuItem} onClick={() => { setOpen(false); setAsking(false); m.loadSound(x); }}>
                    <span className={s.menuCheck} aria-hidden>{m.saved.savedAs === x.name && m.preset === x.preset ? "✓" : ""}</span>
                    <span className={s.menuName}>{x.name}</span>
                    <small>{MAKE_PRESETS[x.preset].name} · {new Date(x.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small>
                  </button>
                ))}
              </div>
            </>
          )}
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

/** The loop, zoomed (handoff §Make 3): chords, bar numbers, the part's clips (heard, else the map's
 *  estimate, faint), the playhead. Grows from 118 to 280 px with spare height. */
function LoopStrip({ part, from, to, chords, levels, heardMs, bpm, originSec, notes, steps }: { part: LabPart; from: number; to: number; chords: (string | null)[]; levels: (number | null)[][] | null; heardMs: () => number; bpm: number; originSec: number; notes: MakeNote[] | null; steps: number | null }) {
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
            {clip(row.heard).map((x) => <span key={`h${x.from}`} className={s.lsClip} data-under={notes?.length ? "" : undefined} style={{ left: pct(x.from), width: w(x.from, x.to), background: part.color }} />)}
            {/* S3-5: the notes Make read from the loop (what Mine plays), by pitch. */}
            {notes && steps && notes.length > 0 && !part.subs.length && (() => {
              const lo = Math.min(...notes.map((n) => n.midi)), hi = Math.max(...notes.map((n) => n.midi)), span = Math.max(1, hi - lo);
              return notes.map((n) => (
                <span key={`n${n.step}`} className={s.lsNote} title={`${noteName(n.midi)}, bar ${from + Math.floor(n.step / 16)}`}
                  style={{ left: `${(n.step / steps) * 100}%`, width: `${(Math.max(0.5, n.dur) / steps) * 100}%`, top: `calc(${((hi - n.midi) / span) * 100}% * 0.8 + 10%)`, background: part.color }} />
              ));
            })()}
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
  const can = m.readState === "ready" && !m.words && m.saved.state !== "saving" && m.saved.action !== "none";
  return (
    <div className={s.saveBar}>
      <label className={s.saveLabel} htmlFor="save-name">Name</label>
      <input id="save-name" name="sound-name" autoComplete="off" className={s.input} value={m.name} maxLength={60} onChange={(e) => m.setName(e.target.value)} disabled={!!m.words} />
      <span className={s.facts} title={m.tags.join(" · ")}>{m.tags.join(" · ")}</span>
      <span className={s.saved} role="status">{m.saved.state === "error" ? m.saved.text : m.words ? "A loop from words can't be saved yet" : m.saved.savedAs && m.saved.action === "none" ? `Saved as ${m.saved.savedAs}` : ""}</span>
      <button className={s.gold} onClick={() => void m.save()} disabled={!can}>{m.saved.state === "saving" ? "Saving…" : "Save to library"}</button>
    </div>
  );
}

/** Make's Mentor rail (handoff §Make 9): the same per-track lab thread as Listen, in order, newest at the bottom. */
function MentorRail({ turns, part, bar, onAsk, onRetry, onSeek, busy, note }: { turns: ThreadTurn[]; part: LabPart; bar: number; onAsk: (q: string, bar: number) => void; onRetry: (id: string) => void; onSeek: (bar: number) => void; busy: boolean; note: string | null }) {
  const list = useRef<HTMLDivElement>(null);
  const last = turns.at(-1);
  useEdgeFades(list, [turns.length]);
  useLayoutEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [turns.length, last?.answer, last?.error]);
  // T110: the rail stays at its newest exchange while answers settle (fonts, "Read all"), until you scroll up.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    let stick = true;
    const onScroll = () => { stick = el.scrollTop + el.clientHeight >= el.scrollHeight - 4; };
    const ro = new ResizeObserver(() => { if (stick) el.scrollTop = el.scrollHeight; });
    for (const c of Array.from(el.children)) ro.observe(c);
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener("scroll", onScroll); };
  }, [turns.length]);
  const noun = partNoun(part.id);
  return (
    <aside className={s.mentorCol} aria-label="Mentor">
      <span className={s.ctx}>Mentor, on {noun}</span>
      <div className={s.list} ref={list}>
        {turns.length === 0 && <p className={s.facts}>No questions yet. Ask about {noun}: the answer is also pinned at bar {bar} on the map.</p>}
        {turns.map((x, i) => <Turn key={x.id} x={x} lines={6} onSeek={onSeek} onRetry={() => onRetry(x.id)} showFacts={x.facts !== turns[i + 1]?.facts} />)}
      </div>
      <div className={s.askBar}>
        <Composer placeholder={`Ask about ${noun}…`} onAsk={(q) => onAsk(q, bar)} disabled={busy} />
        {note && <p className={s.facts}>{note}</p>}
      </div>
    </aside>
  );
}
