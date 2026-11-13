"use client";

// Make for FX (Phase 5 slice 3, P5–P10; design Fold, round 4 fold-fx, T120, T124). Three rows of one
// fixed height (Impact, Downlifter, Noise riser), each a shape where it sits in the loop with its bars
// written in the strip; the knob block anchored under them. Nothing is read note by note: the rows are
// timed to the map's sections. Mine is my FX on top of the drop; A/B "The drop as is" against Mine at
// the same loudness, the original drums under both by default. No closeness score for FX (T120).
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { LabTransport, LoopState } from "@/lib/lab/transport";
import { MakeClient } from "@/lib/make/make-client";
import type { FxMeasure } from "@/lib/make/fx-make";
import { FX_KNOBS, FX_KNOB_SPECS, FX_NOUN, FX_PRESETS, FX_ROWS, FX_ROW_ABOUT, FX_ROW_DEFAULT, FX_ROW_NAMES, FX_TYPICAL, clampFxMacros, fxKnobWord, fxPassBars, fxPlan, fxRowOf, fxRowPresets, rootMidiOf, type FxKnobId, type FxMacros, type FxPlan, type FxPresetId, type FxRow } from "@/lib/make/fx-synth";
import { isFxSound, saveAction, soundId, suggestFxName, suggestFxTags, type FxSound } from "@/lib/make/library";
import { ApiError, mentorApi } from "@/lib/mentor/client";
import { Knob } from "@/components/ui/knob";
import { Playhead, useShort } from "./make-drums";
import s from "./lab.module.css";

const loopKeyOf = (l: LoopState | null) => (l?.state === "memory" ? `${Math.round(l.startMs)}-${Math.round(l.endMs)}` : null);
type ReadState = "idle" | "reading" | "ready" | "error";
type Level = { rmsDb: number; lufs: number; blocks: number[] };
type Read = { loopKey: string; measures: Record<FxRow, FxMeasure>; level: { bed: Level; noBed: Level }; samples: number; rate: number };
type Sound = { preset: FxPresetId; macros: FxMacros };
const fresh = (p: FxPresetId): Sound => ({ preset: p, macros: clampFxMacros(p, undefined) });
const perRow = <T,>(f: (r: FxRow) => T) => Object.fromEntries(FX_ROWS.map((r) => [r, f(r)])) as Record<FxRow, T>;
const CREAM = "#cdbfa8";

export type FxOpts = {
  tr: RefObject<LabTransport | null>; active: boolean; loop: LoopState | null; bpm: number; keyName: string; scale: string; code: string; title: string; url: string;
  /** The loop's first bar (1-based) and its length in bars, and the map's section starts (1-based). */
  from: number | null; loopBars: number | null; sectionStarts: number[];
};

/** Everything Make's FX keep while you switch family, or to Listen and back. */
export function useFx(o: FxOpts) {
  const { tr } = o;
  const client = useRef<MakeClient | null>(null);
  const cl = () => (client.current ??= new MakeClient());
  useEffect(() => () => { client.current?.stop(); client.current = null; }, []);
  const loopKey = loopKeyOf(o.loop);
  const scale = o.scale === "major" || o.scale === "minor" ? o.scale : null;

  const [open, setOpen] = useState<FxRow>("riser");
  const [sounds, setSounds] = useState<Record<FxRow, Sound>>(() => perRow((r) => fresh(FX_ROW_DEFAULT[r])));
  const [readS, setReadS] = useState<Read | null>(null);
  const [state, setState] = useState<{ loopKey: string; state: ReadState; error?: string } | null>(null);
  const [ab, setAb] = useState<"a" | "b">("a");
  const [bed, setBed] = useState(true); // P7: the original drums under both A and B
  const [mineS, setMine] = useState<{ key: string; partsDb: number; ms: number } | null>(null);
  const [names, setNames] = useState<Record<FxRow, string | null>>(() => perRow(() => null));
  const [last, setLast] = useState<Record<FxRow, { id: string; sound: string; name: string } | null>>(() => perRow(() => null));
  const [saveState, setSaveState] = useState<{ state: "idle" | "saving" | "error"; text?: string }>({ state: "idle" });
  const [mySounds, setMySounds] = useState<FxSound[]>([]);

  const read = readS && readS.loopKey === loopKey ? readS : null;
  const readState: ReadState = state && state.loopKey === loopKey ? state.state : "idle";
  const plan: FxPlan | null = useMemo(() => (o.from !== null && o.loopBars ? fxPlan(o.from, o.loopBars, o.sectionStarts, perRow((r) => sounds[r].macros)) : null), [o.from, o.loopBars, o.sectionStarts, sounds]);
  const mineKeyNow = read && plan ? `${read.loopKey}|${bed ? 1 : 0}|${FX_ROWS.map((r) => `${sounds[r].preset}:${FX_KNOBS[r].map((k) => (sounds[r].macros[k] ?? 0).toFixed(3)).join(",")}`).join("|")}` : null;
  const mine = mineS && read && mineS.key.startsWith(`${read.loopKey}|`) ? mineS : null;

  // Measure the drop once its loop is in memory: copies of its parts go to the worker, which zeroes them (C2).
  const readFor = state?.loopKey ?? null;
  const startRead = useCallback((key: string) => {
    const t = tr.current, parts = [0, 1, 2, 3].map((p) => t?.loopPart(p) ?? null);
    if (!t || parts.some((p) => !p) || o.from === null || !o.loopBars) return;
    const [dr, bs, ot, vo] = parts as NonNullable<(typeof parts)[number]>[];
    const n = dr.left.length, mk = () => new Float32Array(n);
    const fxL = mk(), fxR = mk(), mixL = mk(), mixR = mk();
    for (let i = 0; i < n; i++) { fxL[i] = ot.left[i] + vo.left[i]; fxR[i] = ot.right[i] + vo.right[i]; mixL[i] = fxL[i] + bs.left[i]; mixR[i] = fxR[i] + bs.right[i]; }
    setState({ loopKey: key, state: "reading" });
    const plan0 = fxPlan(o.from, o.loopBars, o.sectionStarts, perRow((r) => FX_PRESETS[FX_ROW_DEFAULT[r]].macros));
    cl().fxRead({ fxL, fxR, mixL, mixR, drL: dr.left.slice(), drR: dr.right.slice(), rate: dr.rate, bpm: o.bpm, plan: plan0, loopBars: o.loopBars, fromBar: o.from }).then((res) => {
      console.info(`[make] fx measured in ${res.ms} ms: ${FX_ROWS.map((r) => `${r} ${res.measures[r].ticks ? "ticks" : "none"}`).join(", ")}; drop ${res.level.bed.lufs} LUFS`);
      setReadS({ loopKey: key, measures: res.measures, level: res.level, samples: n, rate: dr.rate });
      setState({ loopKey: key, state: "ready" });
    }, (e) => setState({ loopKey: key, state: "error", error: `Make couldn't measure the drop: ${e instanceof Error ? e.message : String(e)}` }));
  }, [o.bpm, o.from, o.loopBars, o.sectionStarts, tr]);
  useEffect(() => {
    if (!o.active || !loopKey || readFor === loopKey) return;
    const t = setTimeout(() => startRead(loopKey), 0);
    return () => clearTimeout(t);
  }, [o.active, loopKey, readFor, startRead]);

  // Mine: my FX at their places, turned down with the parts so B is as loud as A.
  useEffect(() => {
    if (!o.active || !read || !plan || !mineKeyNow || (mineKeyNow === mineS?.key && tr.current?.mineOwner === "fx")) return;
    const t = setTimeout(() => {
      const lv = bed ? read.level.bed : read.level.noBed;
      // FX-R3: a copy of exactly the parts heard under B (the drums only with the bed), so B is matched on
      // the real sum; transferred to the worker, which zeroes it (C2).
      const parts = [0, 1, 2, 3].map((p) => tr.current?.loopPart(p) ?? null);
      let mixL: Float32Array | undefined, mixR: Float32Array | undefined;
      if (parts.every((p) => p && p.left.length === read.samples)) {
        mixL = new Float32Array(read.samples); mixR = new Float32Array(read.samples);
        parts.forEach((p, i) => { if (i === 0 && !bed) return; for (let j = 0; j < read.samples; j++) { mixL![j] += p!.left[j]; mixR![j] += p!.right[j]; } });
      }
      cl().fxRender({ plan, sounds: perRow((r) => ({ ...sounds[r], on: true })), rootMidi: rootMidiOf(o.keyName || "A"), bpm: o.bpm, rate: read.rate, samples: read.samples, mixRmsDb: lv.rmsDb, blocksA: lv.blocks, mixL, mixR }).then(({ res, stale }) => {
        if (stale || loopKeyOf(tr.current?.state.loop ?? null) !== read.loopKey) return;
        tr.current?.setMine(res, "fx");
        setMine({ key: mineKeyNow, partsDb: res.partsDb, ms: res.ms });
      }, (e) => console.warn("[make] fx render failed", e));
    }, 80);
    return () => clearTimeout(t);
  }, [o.active, read, plan, mineKeyNow, mineS?.key, sounds, bed, o.bpm, o.keyName, tr]);

  useEffect(() => {
    if (!o.code || !o.url) return;
    let live = true;
    mentorApi(o.code).sounds({ source: o.url, part: "other" }).then((xs) => { if (live) setMySounds(xs.filter(isFxSound) as FxSound[]); }, () => { /* none */ });
    return () => { live = false; };
  }, [o.code, o.url]);

  // Re-picking the current preset resets its knobs (N4).
  const setPreset = (row: FxRow, p: FxPresetId) => setSounds((x) => ({ ...x, [row]: fresh(p) }));
  /** FX-F3: a typical house-drop start for a row with nothing clear to aim at. */
  const tryTypical = (row: FxRow) => setSounds((x) => ({ ...x, [row]: { preset: FX_TYPICAL[row].preset, macros: clampFxMacros(FX_TYPICAL[row].preset, FX_TYPICAL[row].macros) } }));
  const setKnob = (row: FxRow, id: FxKnobId, v: number) => setSounds((x) => (x[row].macros[id] === v ? x : { ...x, [row]: { ...x[row], macros: { ...x[row].macros, [id]: v } } }));
  const loadSound = (x: FxSound) => {
    const row = fxRowOf(x.preset), snd = { preset: x.preset, macros: clampFxMacros(x.preset, x.macros) };
    setSounds((s0) => ({ ...s0, [row]: snd }));
    setNames((n) => ({ ...n, [row]: x.name }));
    setLast((l) => ({ ...l, [row]: { id: x.id, sound: soundId(snd.preset, snd.macros), name: x.name } }));
    setOpen(row);
  };

  // Save the open row (P9): its sound, one event per pass on the root, landing on the FX lane.
  const cur = sounds[open], sid = soundId(cur.preset, cur.macros);
  const suggested = suggestFxName(cur.preset, cur.macros, o.title);
  const lastRow = last[open], nameRaw = names[open];
  const nameField = nameRaw === null || (lastRow && lastRow.sound !== sid && nameRaw === lastRow.name) ? suggested : nameRaw;
  const nameNow = nameField.trim() || suggested;
  const action = saveAction({ sound: sid, name: nameNow }, lastRow);
  const tags = scale && o.keyName ? suggestFxTags(cur.preset, o.keyName, scale, o.bpm, o.title, cur.macros) : [];
  const savedRows = perRow((r) => !!last[r] && last[r]!.sound === soundId(sounds[r].preset, sounds[r].macros));
  const canSave = !!read && !!scale && !!o.keyName && saveState.state !== "saving" && action.kind !== "none";
  const save = async (row: FxRow = open, nameOverride?: string) => {
    if (!scale || !o.keyName) return;
    const snd = sounds[row], id = soundId(snd.preset, snd.macros), lr = last[row];
    const nm = (nameOverride ?? (row === open ? nameNow : suggestFxName(snd.preset, snd.macros, o.title))).trim();
    const act = saveAction({ sound: id, name: nm }, lr);
    if (act.kind === "none") return;
    setSaveState({ state: "saving" });
    try {
      const api = mentorApi(o.code), bars = fxPassBars(snd.preset, snd.macros);
      const res = act.kind === "patch"
        ? await api.patchSound(act.id, { name: nm })
        : await api.addSound({
          name: nm, part: "other", preset: snd.preset, macros: snd.macros, pattern: { bars, notes: [{ step: 0, midi: rootMidiOf(o.keyName), dur: bars * 16, vel: 1 }] },
          key: o.keyName, scale, bpm: o.bpm, source: { title: o.title, url: o.url }, tags: suggestFxTags(snd.preset, o.keyName, scale, o.bpm, o.title, snd.macros),
        });
      setLast((l) => ({ ...l, [row]: { id: res.id, sound: id, name: res.name } }));
      setNames((n) => ({ ...n, [row]: res.name }));
      if (isFxSound(res)) setMySounds((xs) => [res as FxSound, ...xs.filter((x) => x.id !== res.id)]);
      setSaveState({ state: "idle" });
    } catch (e) {
      setSaveState({ state: "error", text: e instanceof ApiError ? e.message : "Couldn't save. Try again." });
    }
  };

  const ticks = perRow((r) => (read ? read.measures[r].ticks : null));
  return {
    open, setOpen, sounds, setPreset, tryTypical, setKnob, ticks, read, readState, readError: state?.error ?? null, plan,
    measures: read?.measures ?? null, loopBars: o.loopBars,
    ab, setAb, bed, setBed, mineReady: !!mine && mine.key === mineKeyNow, mineAny: !!mine, partsDb: mine?.partsDb ?? 0,
    mySounds, loadSound, name: nameField, setName: (v: string) => setNames((n) => ({ ...n, [open]: v })), tags, save, canSave, savedRows,
    saved: { state: saveState.state, text: saveState.text, savedAs: lastRow && lastRow.sound === sid ? lastRow.name : null, action: action.kind },
    /** What the Lab Mentor gets with a question asked in FX: the open row and what the original measured there. */
    labRow: { family: "fx" as const, preset: sounds[open].preset as string, knobs: sounds[open].macros as Record<string, number>, ticks: (ticks[open] ?? null) as Record<string, number> | null, note: read?.measures[open].heard ?? null },
    /** Graders (slice 3): what Make's FX hold now, numbers only. */
    debug: () => ({ readState, open, ab, bed, plan, sounds, measures: read?.measures ?? null, level: read ? { bed: { rmsDb: read.level.bed.rmsDb, lufs: read.level.bed.lufs }, noBed: { rmsDb: read.level.noBed.rmsDb, lufs: read.level.noBed.lufs } } : null, mine: mine ? { ready: mine.key === mineKeyNow, partsDb: mine.partsDb, renderMs: mine.ms } : null, saved: perRow((r) => last[r]), mySounds: mySounds.map((x) => ({ id: x.id, name: x.name, preset: x.preset })) }),
  };
}
export type FxModel = ReturnType<typeof useFx>;

// ── The middle (Fold, fold-fx) ──────────────────────────────────────────────────────────────────

const W = 1000;
const TRAIT: Record<FxKnobId, [string, string]> = { size: ["bigger", "smaller"], tone: ["brighter", "darker"], tail: ["longer", "shorter"], drop: ["deeper", "shallower"], length: ["longer", "shorter"], rise: ["longer", "shorter"], width: ["wider", "narrower"] };
/** "Tone up to bright; the original noise is brighter." (the two knobs furthest from their ticks). */
function fxLine(id: FxPresetId, cur: FxMacros, ticks: FxMacros): string {
  const row = fxRowOf(id);
  const moves = FX_KNOBS[row].filter((k) => ticks[k] !== undefined).map((k) => ({ k, up: (ticks[k] ?? 0) > (cur[k] ?? 0), by: Math.abs((ticks[k] ?? 0) - (cur[k] ?? 0)) })).filter((x) => x.by >= 0.08).sort((a, b) => b.by - a.by).slice(0, 2);
  if (!moves.length) return "You're on the gold ticks. Switch A/B to judge the rest by ear.";
  const say = moves.map(({ k, up }) => { const w = (v: number) => fxKnobWord(id, k, v).split(" · ")[0]; const to = w(ticks[k] ?? 0); return `${FX_KNOB_SPECS[k].name} ${up ? "up" : "down"}${to !== w(cur[k] ?? 0) ? ` to ${to}` : ""}`; });
  return `${say.join(", ")}; the original ${FX_NOUN[row]} is ${moves.map(({ k, up }) => TRAIT[k][up ? 0 : 1]).join(" and ")}.`;
}

/** Where a row's shape sits (SVG path in drawing units) and where its bars label goes. */
function shapeOf(row: FxRow, place: FxPlan[FxRow] | null, bars: number) {
  const H = 38, gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars;
  const xb = (b: number) => { const i = Math.min(bars - 1, Math.max(0, Math.floor(b))); return i * (bw + gap) + (b - i) * bw; };
  if (!place) return { d: "", tx: 0, end: false };
  const x = xb(place.atBar), x1 = xb(Math.min(bars, place.atBar + place.bars) - 1e-6);
  // FX-F5: every shape is as long as its knob says (the impact's tail too); FX-F9: its label sits beside
  // it, on the side with room, never on it.
  const ROOM = 160; // drawing units a label needs (about 110 px on a 1440 px window)
  const right = { tx: x1 + 10, end: false }, left = { tx: x - 10, end: true };
  // No room either side (a shape over most of the loop): inside its empty half (above a fall's low end,
  // above a riser's low start), which a label at mid-height doesn't touch.
  const fallSide = x1 + ROOM <= W ? right : x >= ROOM ? left : { tx: x1 - 10, end: true };
  if (row === "impact") return { d: `M${x} 2 L${x + 8} 2 L${x1} ${H * 0.85} L${x1} ${H} L${x} ${H} Z`, ...fallSide };
  if (row === "down") return { d: `M${x} 2 L${x1} ${H} L${x} ${H} Z`, ...fallSide };
  return { d: `M${x} ${H} L${x1} 2 L${x1} ${H} Z`, ...(x >= ROOM ? left : x1 + ROOM <= W ? right : { tx: x + 10, end: false }) };
}

/** One row's shape where it sits: a hit falling off, a fall, a rise; its bars written beside it (fold-fx). */
function Shape({ row, place, bars, lit }: { row: FxRow; place: FxPlan[FxRow] | null; bars: number; lit: boolean }) {
  const H = 38, gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars, sh = shapeOf(row, place, bars);
  return (
    <>
      <svg className={s.drPattern} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: bars }, (_, b) => <rect key={b} x={b * (bw + gap)} y={0} width={bw} height={H} fill="rgba(241,230,211,.04)" />)}
        {sh.d && <path d={sh.d} fill={CREAM} opacity={lit ? 0.85 : 0.4} />}
      </svg>
      {place && <span className={s.fxLabel} data-lit={lit ? "" : undefined} style={{ left: `${(Math.max(0, Math.min(W, sh.tx)) / W) * 100}%`, transform: sh.end ? "translate(-100%, -50%)" : "translateY(-50%)" }}>{place.label}</span>}
    </>
  );
}

function waitLine(m: FxModel, loop: LoopState | null, playing: boolean): string | null {
  if (m.readState === "ready") return null;
  if (!loop) return "Loop a section first: Make times your FX to a loop of the song.";
  const lenS = Math.round((loop.endMs - loop.startMs) / 1000);
  if (loop.state === "filling") {
    if (loop.laps >= 2) return "The loop isn't filling: the part splitter is running behind on this Mac. Loop a shorter section, or close other tabs, then press Play again.";
    if (!playing) return `Press Play. The loop fills from the song first (about ${lenS + 7} s), then your FX appear here.`;
    return `Filling the loop… ${loop.etaS ?? lenS} s`;
  }
  if (m.readState === "reading" || m.readState === "idle") return "Listening to the drop… a second.";
  return m.readError ?? "Press Play.";
}

export function FxMiddle({ m, loop, from, playing, heardMs }: { m: FxModel; loop: LoopState | null; from: number | null; playing: boolean; heardMs: () => number }) {
  const bars = m.loopBars ?? 8;
  const gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars, every = bars > 8 ? 4 : 1;
  const wait = waitLine(m, loop, playing), off = !!wait, short = useShort();
  const row = m.open, snd = m.sounds[row], ticks = m.ticks[row] ?? undefined, meas = m.measures?.[row];
  let line: React.ReactNode;
  if (!meas) line = null;
  // FX-F3: nothing measured still leaves something to aim for: a typical start for a house drop.
  else if (!meas.ticks) line = <>Mentor: {meas.heard}, so no ticks. A house drop often uses {FX_TYPICAL[row].say}.{" "}
    <button className={s.textBtn} onClick={() => m.tryTypical(row)}>Try it</button><br /><span className={s.faintLine}>Then shape it by ear with A/B.</span></>;
  else line = <>Mentor: {fxLine(snd.preset, snd.macros, meas.ticks)}<br /><span className={s.faintLine}>Heard: {meas.heard}.</span></>;
  return (
    <div className={s.drums}>
      <div className={s.drRows} role="group" aria-label="FX rows">
        <div className={s.drRow} data-head="">
          <span />
          <div className={s.drBars} aria-hidden>
            {from !== null && Array.from({ length: bars }, (_, b) => b).filter((b) => b % every === 0).map((b) => <span key={b} style={{ left: `${((b * (bw + gap)) / W) * 100}%` }}>{from + b}</span>)}
          </div>
          <span />
        </div>
        {FX_ROWS.map((r) => {
          const lit = r === row;
          return (
            <div key={r} className={s.drRow} data-lit={lit ? "" : undefined}>
              <button className={s.drName} aria-pressed={lit} onClick={() => m.setOpen(r)}>{FX_ROW_NAMES[r]}</button>
              <div className={s.drTrack}><Shape row={r} place={m.plan?.[r] ?? null} bars={bars} lit={lit} /></div>
              <div className={s.drSlot}>{!lit && <span className={s.drPreset}>{FX_PRESETS[m.sounds[r].preset].name}</span>}{m.savedRows[r] && <span className={s.drSaved}>saved</span>}</div>
            </div>
          );
        })}
        {loop?.state === "memory" && !off && <div className={s.drHeadBox}><Playhead heardMs={heardMs} loop={loop} bars={bars} /></div>}
      </div>
      <div className={s.drBlock}>
        {/* FX-F2: what the row does, in one plain line. */}
        <span className={s.drLabel}>{FX_ROW_NAMES[row]} · {FX_ROW_ABOUT[row]}</span>
        <FxPreset m={m} row={row} />
        <div className={s.drKnobs} data-off={off ? "" : undefined}>
          {FX_KNOBS[row].map((id) => (
            <Knob key={`${row}-${id}`} id={id as never} spec={FX_KNOB_SPECS[id]} wordOf={(v) => fxKnobWord(snd.preset, id, v)} value={snd.macros[id] ?? 0.5} sug={off ? undefined : ticks?.[id]}
              color={CREAM} disabled={off} onChange={(v) => m.setKnob(row, id, v)} reset={clampFxMacros(snd.preset, undefined)[id] ?? 0.5} size={short === 2 ? 64 : short === 1 ? 72 : 88} />
          ))}
        </div>
        {wait ? <p className={s.drWait} role="status">{wait}</p> : (
          <div className={s.drSuggest}>
            <p className={s.suggest} aria-live="polite">{line}</p>
            {/* The measure is made with the read; the ticks are placed at once (gold ticks only). */}
            {meas?.ticks ? <span className={s.drPlaced} role="status">Ticks placed</span> : null}
          </div>
        )}
      </div>
    </div>
  );
}

function FxPreset({ m, row }: { m: FxModel; row: FxRow }) {
  const [openMenu, setOpenMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openMenu) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpenMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenu(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [openMenu]);
  const cur = m.sounds[row].preset, mine = m.mySounds.filter((x) => fxRowOf(x.preset) === row);
  return (
    <div className={s.preset} ref={box}>
      <button className={s.drPresetName} aria-haspopup="menu" aria-expanded={openMenu} onClick={() => setOpenMenu(!openMenu)} aria-label={`Preset: ${FX_PRESETS[cur].name}. Change preset`}>
        {FX_PRESETS[cur].name} <span aria-hidden>▾</span>
      </button>
      {openMenu && (
        <div className={s.menu} role="menu" aria-label={`${FX_ROW_NAMES[row]} presets`}>
          {fxRowPresets(row).map((id) => (
            <button key={id} role="menuitemradio" aria-checked={id === cur} className={s.menuItem} onClick={() => { setOpenMenu(false); m.setPreset(row, id); }}>
              <span className={s.menuCheck} aria-hidden>{id === cur ? "✓" : ""}</span>
              <span>{FX_PRESETS[id].name}</span>
              <small>{FX_PRESETS[id].tags.join(" · ")}</small>
            </button>
          ))}
          {mine.length > 0 && (
            <>
              <i className={s.menuRule} aria-hidden />
              <span className={s.menuHead}>Your sounds</span>
              <div className={s.menuSounds} role="group" aria-label="Your sounds from this track">
                {mine.map((x) => (
                  <button key={x.id} role="menuitem" className={s.menuItem} onClick={() => { setOpenMenu(false); m.loadSound(x); }}>
                    <span className={s.menuCheck} aria-hidden />
                    <span className={s.menuName}>{x.name}</span>
                    <small>{FX_PRESETS[x.preset].name}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** A/B: the drop as is against my FX on it, at the same loudness, the drums under both (P7); no score (T120). */
export function FxCheck({ m }: { m: FxModel }) {
  return (
    <div className={`${s.checkRow} ${s.drCheck}`}>
      <div className={s.abWrap}>
        <div className={s.ab} role="group" aria-label="Compare at the same loudness">
          <button aria-pressed={m.ab === "a"} onClick={() => m.setAb("a")}>A · The drop as is</button>
          <button aria-pressed={m.ab === "b"} onClick={() => m.setAb("b")} disabled={!m.mineAny} title={m.mineAny ? undefined : "Mine plays once the loop is in memory"}>B · Mine</button>
        </div>
        <span className={s.faint}>same loudness</span>
      </div>
      <button className={s.ghost} aria-pressed={m.bed} onClick={() => m.setBed(!m.bed)} title="Plays the original drums under both A and B">{m.bed ? "Drums under both: on" : "Drums under both: off"}</button>
      <span className={s.drScore}>no closeness score for FX</span>
    </div>
  );
}

/** Save the open row ("Save riser"); rows show "✓ saved". */
export function FxSaveBar({ m }: { m: FxModel }) {
  return (
    <div className={s.saveBar}>
      <label className={s.saveLabel} htmlFor="save-name">Name</label>
      <input id="save-name" name="sound-name" autoComplete="off" spellCheck={false} className={s.input} value={m.name} maxLength={60} onChange={(e) => m.setName(e.target.value)} disabled={m.readState !== "ready"} />
      <span className={s.facts} title={m.tags.join(" · ")}>{m.tags.join(" · ")}</span>
      <span className={s.saved} role="status">{m.saved.state === "error" ? m.saved.text : m.saved.savedAs && m.saved.action === "none" ? `Saved as ${m.saved.savedAs}` : ""}</span>
      <button className={s.gold} onClick={() => void m.save()} disabled={!m.canSave}>{m.saved.state === "saving" ? "Saving…" : `Save ${FX_NOUN[m.open]}`}</button>
    </div>
  );
}
