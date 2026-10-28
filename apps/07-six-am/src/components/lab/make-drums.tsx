"use client";

// Make for drums (Phase 5 slice 1, P1, P3, P6–P10; design Fold, round 3 + round 4, L224–L226,
// T116–T124). Three rows of one fixed height on top (kick, clap & snare, hats), the open row lit;
// the knob block (row name, preset, knobs, Mentor line and Suggest) anchored under them, so picking
// a row moves nothing. Mine plays the three rows together over the loop, in its timing (swing kept,
// L215), at the original's loudness; A/B against the original drum part, the original bass under
// both by default (P7). The drum part is read off the main thread from a copy that the worker zeroes
// (C2): only numbers come back. Save saves the open row ("Save kick") to My sounds.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { LabTransport, LoopState } from "@/lib/lab/transport";
import { DRUM_KNOB_SPECS, DRUM_PRESETS, DRUM_ROWS, DRUM_ROW_NAMES, ROW_KNOBS, ROW_PRESETS, clampDrumMacros, drumKnobWord, drumMoves, drumSuggestLine, type DrumMacros, type DrumPresetId, type DrumRow } from "@/lib/make/drum-synth";
import { foldRow, type DrumsCloseness, type DrumsReading, type DrumsReport, type RowSound, type RowTarget } from "@/lib/make/drums-make";
import { MakeClient } from "@/lib/make/make-client";
import { drumNoun, isDrumSound, saveAction, soundId, suggestDrumName, suggestDrumTags, type DrumSound } from "@/lib/make/library";
import { ApiError, mentorApi } from "@/lib/mentor/client";
import { Knob } from "@/components/ui/knob";
import s from "./lab.module.css";

const loopKeyOf = (l: LoopState | null) => (l?.state === "memory" ? `${Math.round(l.startMs)}-${Math.round(l.endMs)}` : null);
type ReadState = "idle" | "reading" | "ready" | "nohits" | "error";
type Read = { loopKey: string; d: DrumsReading; targets: Record<DrumRow, RowTarget | null>; report: DrumsReport; levelDb: number; lufs: number; samples: number; rate: number };
type Sound = { preset: DrumPresetId; macros: DrumMacros };
const HOME: Record<DrumRow, DrumPresetId> = { kick: "kick-deep-909", clap: "clap-wide", hats: "hats-open-909" };
const fresh = (p: DrumPresetId): Sound => ({ preset: p, macros: clampDrumMacros(p, undefined) });
const perRow = <T,>(f: (r: DrumRow) => T) => Object.fromEntries(DRUM_ROWS.map((r) => [r, f(r)])) as Record<DrumRow, T>;
const rowTitle = (r: DrumRow) => DRUM_ROW_NAMES[r].toLowerCase();

export type DrumsOpts = {
  tr: RefObject<LabTransport | null>;
  active: boolean;
  loop: LoopState | null;
  bpm: number;
  keyName: string;
  scale: string;
  code: string;
  title: string;
  url: string;
};

/** Everything Make's drums keep while you switch family, or to Listen and back. */
export function useDrums(o: DrumsOpts) {
  const { tr } = o;
  const client = useRef<MakeClient | null>(null);
  const cl = () => (client.current ??= new MakeClient());
  useEffect(() => () => { client.current?.stop(); client.current = null; }, []);
  const loopKey = loopKeyOf(o.loop);

  const [open, setOpen] = useState<DrumRow>("kick");
  const [sounds, setSounds] = useState<Record<DrumRow, Sound>>(() => perRow((r) => fresh(HOME[r])));
  const [ticksS, setTicks] = useState<Record<DrumRow, { for: string; macros: DrumMacros; moved: string | null } | null>>(() => perRow(() => null));
  const [suggesting, setSuggesting] = useState<DrumRow | null>(null);
  const [readS, setReadS] = useState<Read | null>(null);
  const [state, setState] = useState<{ loopKey: string; state: ReadState; error?: string } | null>(null);
  const [anywayS, setAnyway] = useState<{ loopKey: string | null; rows: DrumRow[] }>({ loopKey: null, rows: [] });
  const [ab, setAb] = useState<"a" | "b">("a");
  const [bed, setBed] = useState(true); // P7: the original bass under both A and B
  const [mineS, setMine] = useState<{ key: string; closeness: DrumsCloseness; gainDb: number; rowGainsDb: Record<DrumRow, number | null>; ms: number } | null>(null);
  const [names, setNames] = useState<Record<DrumRow, string | null>>(() => perRow(() => null));
  const [last, setLast] = useState<Record<DrumRow, { id: string; sound: string; name: string } | null>>(() => perRow(() => null));
  const [saveState, setSaveState] = useState<{ state: "idle" | "saving" | "error"; text?: string }>({ state: "idle" });
  const [mySounds, setMySounds] = useState<DrumSound[]>([]);

  const read = readS && readS.loopKey === loopKey ? readS : null;
  const readState: ReadState = state && state.loopKey === loopKey ? state.state : "idle";
  const anyway = useMemo(() => (anywayS.loopKey === loopKey ? anywayS.rows : []), [anywayS, loopKey]);
  const on = useMemo(() => perRow((r) => !!read && read.d.rows[r].hits.length > 0 && (!read.d.rows[r].doubtful || anyway.includes(r))), [read, anyway]);
  const signature = (x: Record<DrumRow, Sound>, onRows: Record<DrumRow, boolean>) => DRUM_ROWS.map((r) => `${x[r].preset}:${ROW_KNOBS[DRUM_PRESETS[x[r].preset].row].map((k) => (x[r].macros[k] ?? 0).toFixed(3)).join(",")}:${onRows[r] ? 1 : 0}`).join("|");
  const mineKeyNow = read ? `${read.loopKey}|${signature(sounds, on)}` : null;
  const mine = mineS && read && mineS.key.startsWith(`${read.loopKey}|`) ? mineS : null;


  const suggest = useCallback(async (r: Read, row: DrumRow, snd: Sound, before: DrumMacros | null) => {
    const target = r.targets[row];
    if (!target) return;
    setSuggesting(row);
    try {
      const res = await cl().drumsSuggest({ target, preset: snd.preset, start: before ? snd.macros : undefined });
      console.info(`[make] drums suggest ${row} ${snd.preset}: ${res.suggestion.renders} renders in ${res.ms} ms, distance ${res.suggestion.distance.toFixed(2)} (preset ${res.suggestion.presetDistance.toFixed(2)})`);
      const after = res.suggestion.macros;
      const moved = before ? ROW_KNOBS[row].filter((k) => Math.abs((after[k] ?? 0) - (before[k] ?? 0)) >= 0.05).map((k) => DRUM_KNOB_SPECS[k].name) : null;
      setTicks((t) => ({ ...t, [row]: { for: soundId(snd.preset, snd.macros), macros: after, moved: moved === null ? null : moved.length ? `Ticks moved: ${moved.join(", ")}.` : "The ticks stayed where they were." } }));
    } catch (e) {
      console.warn("[make] drums suggest failed", e);
    } finally {
      setSuggesting(null);
    }
  }, []);

  // Read the looped drum part once it's in memory: a copy goes to the worker, which zeroes it (C2).
  const readFor = state?.loopKey ?? null;
  const soundsRef = useRef(sounds);
  useEffect(() => { soundsRef.current = sounds; }, [sounds]);
  const startRead = useCallback((key: string) => {
    const held = tr.current?.loopPart(0);
    if (!held) return;
    setState({ loopKey: key, state: "reading" });
    setTicks(perRow(() => null));
    const left = held.left.slice(), right = held.right.slice();
    const samples = left.length, rate = held.rate;
    cl().drumsRead({ left, right, rate, bpm: o.bpm }).then(async (res) => {
      const n = DRUM_ROWS.map((r) => res.reading.rows[r].hits.length);
      console.info(`[make] drums read in ${res.ms} ms: kick ${n[0]}, clap ${n[1]}, hats ${n[2]} hits, grid ${res.reading.gridMs} ms, swing ${res.reading.swingMs} ms`);
      if (!n.some((x) => x > 0)) { setState({ loopKey: key, state: "nohits" }); return; }
      const r: Read = { loopKey: key, d: res.reading, targets: res.targets, report: res.report, levelDb: res.levelDb, lufs: res.lufs, samples, rate };
      setReadS(r);
      setState({ loopKey: key, state: "ready" });
      // Gold ticks for every row with hits, one after another in the search worker.
      for (const row of DRUM_ROWS) if (r.targets[row]) await suggest(r, row, soundsRef.current[row], null);
    }, (e) => setState({ loopKey: key, state: "error", error: `Make couldn't read the drums: ${e instanceof Error ? e.message : String(e)}` }));
  }, [o.bpm, tr, suggest]);
  useEffect(() => {
    if (!o.active || !loopKey || readFor === loopKey) return;
    const t = setTimeout(() => startRead(loopKey), 0);
    return () => clearTimeout(t);
  }, [o.active, loopKey, readFor, startRead]);

  // Mine: the three rows rendered together on every change (debounced), swapped in, in sync.
  useEffect(() => {
    // Mine is one buffer for every family: render again when the bass's sound took it meanwhile.
    if (!o.active || !read || !mineKeyNow || (mineKeyNow === mineS?.key && tr.current?.mineOwner === "drums")) return;
    const t = setTimeout(() => {
      const levels = perRow((r) => read.targets[r]?.levelDb ?? null);
      const rowSounds: Record<DrumRow, RowSound> = perRow((r) => ({ ...sounds[r], on: on[r] }));
      cl().drumsRender({ reading: read.d, sounds: rowSounds, levels, report: read.report, bpm: o.bpm, rate: read.rate, samples: read.samples, levelDb: read.levelDb, lufs: read.lufs }).then(({ res, stale }) => {
        if (stale || loopKeyOf(tr.current?.state.loop ?? null) !== read.loopKey) return;
        tr.current?.setMine(res, "drums");
        setMine({ key: mineKeyNow, closeness: res.closeness, gainDb: res.gainDb, rowGainsDb: res.rowGainsDb, ms: res.ms });
      }, (e) => console.warn("[make] drums render failed", e));
    }, 60);
    return () => clearTimeout(t);
  }, [o.active, read, mineKeyNow, mineS?.key, sounds, on, o.bpm, tr]);

  // This track's drum sounds in the library (numbers only), for each row's preset menu.
  useEffect(() => {
    if (!o.code || !o.url) return;
    let live = true;
    mentorApi(o.code).sounds({ source: o.url, part: "drums" }).then((xs) => { if (live) setMySounds(xs.filter(isDrumSound) as DrumSound[]); }, () => { /* the menu just has none */ });
    return () => { live = false; };
  }, [o.code, o.url]);

  const setPreset = (row: DrumRow, p: DrumPresetId) => {
    const next = fresh(p);
    setSounds((x) => ({ ...x, [row]: next }));
    setTicks((t) => ({ ...t, [row]: null }));
    if (read) void suggest(read, row, next, null);
  };
  const setKnob = (row: DrumRow, id: keyof DrumMacros, v: number) => setSounds((x) => (x[row].macros[id] === v ? x : { ...x, [row]: { ...x[row], macros: { ...x[row].macros, [id]: v } } }));
  const loadSound = (x: DrumSound) => {
    const row = DRUM_PRESETS[x.preset].row;
    const snd = { preset: x.preset, macros: clampDrumMacros(x.preset, x.macros) };
    setSounds((s0) => ({ ...s0, [row]: snd }));
    setNames((n) => ({ ...n, [row]: x.name }));
    setLast((l) => ({ ...l, [row]: { id: x.id, sound: soundId(snd.preset, snd.macros), name: x.name } }));
    setTicks((t) => ({ ...t, [row]: null }));
    setOpen(row);
    if (read) void suggest(read, row, snd, null);
  };
  const playAnyway = (row: DrumRow) => setAnyway({ loopKey, rows: [...anyway.filter((r) => r !== row), row] });

  // Save the open row (P9): its sound, and its hits folded to a 1-, 2- or 4-bar repeat.
  const scale = o.scale === "major" || o.scale === "minor" ? o.scale : null;
  const cur = sounds[open];
  const sid = soundId(cur.preset, cur.macros);
  const suggested = suggestDrumName(cur.preset, cur.macros, o.title);
  const lastRow = last[open];
  const nameRaw = names[open];
  const nameField = nameRaw === null || (lastRow && lastRow.sound !== sid && nameRaw === lastRow.name) ? suggested : nameRaw;
  const nameNow = nameField.trim() || suggested;
  const action = saveAction({ sound: sid, name: nameNow }, lastRow);
  const tags = suggestDrumTags(cur.preset, o.bpm, o.title);
  const savedRows = perRow((r) => !!last[r] && last[r]!.sound === soundId(sounds[r].preset, sounds[r].macros));
  const canSave = readState === "ready" && on[open] && saveState.state !== "saving" && action.kind !== "none";
  const save = async (row: DrumRow = open, nameOverride?: string) => {
    if (!read || !scale || !o.keyName) return;
    const snd = sounds[row], id = soundId(snd.preset, snd.macros);
    const lr = last[row];
    const nm = (nameOverride ?? (row === open ? nameNow : suggestDrumName(snd.preset, snd.macros, o.title))).trim();
    const act = saveAction({ sound: id, name: nm }, lr);
    if (act.kind === "none" || !on[row]) return;
    setSaveState({ state: "saving" });
    try {
      const api = mentorApi(o.code);
      const res = act.kind === "patch"
        ? await api.patchSound(act.id, { name: nm })
        : await api.addSound({
          name: nm, part: "drums", preset: snd.preset, macros: snd.macros,
          pattern: foldRow(row, read.d.rows[row].hits, read.d.steps),
          key: o.keyName, scale, bpm: o.bpm, source: { title: o.title, url: o.url }, tags: suggestDrumTags(snd.preset, o.bpm, o.title),
        });
      setLast((l) => ({ ...l, [row]: { id: res.id, sound: id, name: res.name } }));
      setNames((n) => ({ ...n, [row]: res.name }));
      if (isDrumSound(res)) setMySounds((xs) => [res as DrumSound, ...xs.filter((x) => x.id !== res.id)]);
      setSaveState({ state: "idle" });
    } catch (e) {
      setSaveState({ state: "error", text: e instanceof ApiError ? e.message : "Couldn't save. Try again." });
    }
  };

  const ticks = perRow((r) => (read ? ticksS[r] : null));
  return {
    open, setOpen, sounds, setPreset, setKnob, ticks, suggesting, read, readState, readError: state?.error ?? null, on, anyway, playAnyway,
    suggestNow: (row: DrumRow) => { if (read) void suggest(read, row, sounds[row], ticks[row]?.macros ?? null); },
    suggestedNow: perRow((r) => !!ticks[r] && ticks[r]!.for === soundId(sounds[r].preset, sounds[r].macros)),
    ab, setAb, bed, setBed, mineReady: !!mine && mine.key === mineKeyNow, mineAny: !!mine, closeness: mine?.closeness ?? null,
    mySounds, loadSound, name: nameField, setName: (v: string) => setNames((n) => ({ ...n, [open]: v })), tags, save, canSave, savedRows,
    saved: { state: saveState.state, text: saveState.text, savedAs: lastRow && lastRow.sound === sid ? lastRow.name : null, action: action.kind },
    bpm: o.bpm,
    /** Graders (Phase 5): what Make's drums hold now, numbers only. */
    debug: () => ({
      readState, open, ab, bed, on, anyway, steps: read?.d.steps ?? null, gridMs: read?.d.gridMs ?? null, swingMs: read?.d.swingMs ?? null,
      rows: read ? perRow((r) => ({ hits: read.d.rows[r].hits, doubtful: read.d.rows[r].doubtful, why: read.d.rows[r].why })) : null,
      targets: read?.targets ?? null, levelDb: read?.levelDb ?? null, lufs: read?.lufs ?? null,
      sounds, ticks: perRow((r) => ticks[r]?.macros ?? null), mine: mine ? { ready: mine.key === mineKeyNow, gainDb: mine.gainDb, rowGainsDb: mine.rowGainsDb, closeness: mine.closeness, renderMs: mine.ms } : null,
      saved: perRow((r) => last[r]), mySounds: mySounds.map((x) => ({ id: x.id, name: x.name, preset: x.preset })),
    }),
  };
}
export type DrumsModel = ReturnType<typeof useDrums>;

// ── The middle (Fold) ───────────────────────────────────────────────────────────────────────────

const W = 1000; // the pattern's drawing units across (scaled to the column)

/** One row's pattern: a block per bar, its hits as bars by velocity; doubtful rows' faint hits hollow. */
function Pattern({ hits, bars, lit, doubtful, empty }: { hits: { step: number; vel: number; faint: boolean }[]; bars: number; lit: boolean; doubtful: boolean; empty: boolean }) {
  const H = 38, gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars, sw = bw / 16;
  return (
    <svg className={s.drPattern} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      {Array.from({ length: bars }, (_, b) => (
        <g key={b}>
          <rect x={b * (bw + gap)} y={0} width={bw} height={H} fill="rgba(241,230,211,.04)" />
          {[4, 8, 12].map((q) => <rect key={q} x={b * (bw + gap) + q * sw - 0.5} y={H * 0.25} width={1} height={H * 0.5} fill="rgba(241,230,211,.07)" />)}
        </g>
      ))}
      {!empty && hits.map((h) => {
        const b = Math.floor(h.step / 16), x = b * (bw + gap) + (h.step % 16) * sw, hh = Math.max(4, H * (0.3 + 0.7 * h.vel)), ww = Math.max(1.5, sw - 1.5);
        return doubtful && h.faint
          ? <rect key={h.step} x={x + 1.25} y={H - hh + 0.5} width={Math.max(1, ww - 1)} height={hh - 1} fill="none" stroke="#f2b134" strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity={0.8} />
          : <rect key={h.step} x={x + 0.75} y={H - hh} width={ww} height={hh} fill="#f2b134" opacity={lit ? 0.4 + 0.6 * h.vel : 0.45} />;
      })}
    </svg>
  );
}

/** The playhead over the three rows: where the loop is now, across bar blocks with their gaps. */
function Playhead({ heardMs, loop, bars }: { heardMs: () => number; loop: LoopState; bars: number }) {
  const el = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    let raf = 0;
    const gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars;
    const tick = () => {
      const f = (heardMs() - loop.startMs) / (loop.endMs - loop.startMs);
      const e = el.current;
      if (e) {
        const inside = f >= 0 && f < 1;
        e.style.display = inside ? "" : "none";
        if (inside) { const b = Math.floor(f * bars), x = b * (bw + gap) + (f * bars - b) * bw; e.style.left = `${(x / W) * 100}%`; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heardMs, loop.startMs, loop.endMs, bars]);
  return <i ref={el} className={s.drHead} aria-hidden />;
}

/** Until the knobs are live: what's happening and how long, said once (in the knob block). */
function waitLine(m: DrumsModel, loop: LoopState | null, playing: boolean): string | null {
  if (m.readState === "ready") return null;
  if (!loop) return "Loop a section first: Make builds your drums on a loop of the song.";
  const lenS = Math.round((loop.endMs - loop.startMs) / 1000);
  if (loop.state === "filling") {
    if (loop.laps >= 2) return "The loop isn't filling: the part splitter is running behind on this Mac. Loop a shorter section, or close other tabs, then press Play again.";
    if (!playing) return `Press Play. The loop fills from the song first (about ${lenS + 7} s), then your drums appear here.`;
    return `Filling the loop… ${loop.etaS ?? lenS} s`;
  }
  if (m.readState === "reading" || m.readState === "idle") return "Reading the drums… a second.";
  if (m.readState === "nohits") return "No drum hits in this loop. Loop a section where the drums play.";
  return m.readError ?? "Press Play.";
}

export function DrumsMiddle({ m, loop, from, playing, heardMs }: { m: DrumsModel; loop: LoopState | null; from: number | null; playing: boolean; heardMs: () => number }) {
  const bars = m.read?.d.bars ?? (loop ? Math.max(1, Math.round((loop.endMs - loop.startMs) / (60000 / m.bpm) / 4)) : 8);
  const every = bars > 8 ? 4 : 1;
  const gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars;
  const wait = waitLine(m, loop, playing);
  const off = !!wait;
  const row = m.open, snd = m.sounds[row], ticks = m.ticks[row]?.macros;
  const noun = drumNoun(snd.preset);
  let line: React.ReactNode;
  if (m.suggesting === row) line = `Measuring the ${noun} against ${DRUM_PRESETS[snd.preset].name}…`;
  else if (!m.read?.targets[row]) line = <span className={s.faintLine}>No {rowTitle(row)} hits in this loop to compare with.</span>;
  else if (!ticks) line = `Mentor: press Suggest for ${rowTitle(row)} to compare this preset with the original.`;
  else line = <>Mentor: {drumSuggestLine(snd.preset, snd.macros, ticks, noun, m.bpm)}{m.ticks[row]?.moved && drumMoves(row, snd.macros, ticks).length > 0 ? <><br /><span className={s.faintLine}>{m.ticks[row]!.moved}</span></> : null}</>;
  return (
    <div className={s.drums}>
      <div className={s.drRows} role="group" aria-label="Drum rows">
        <div className={s.drRow} data-head="">
          <span />
          <div className={s.drBars} aria-hidden>
            {from !== null && Array.from({ length: bars }, (_, b) => b).filter((b) => b % every === 0).map((b) => <span key={b} style={{ left: `${((b * (bw + gap)) / W) * 100}%` }}>{from + b}</span>)}
          </div>
          <span />
        </div>
        {DRUM_ROWS.map((r) => {
          const rr = m.read?.d.rows[r], lit = r === row, doubtful = !!rr?.doubtful && !m.anyway.includes(r);
          return (
            <div key={r} className={s.drRow} data-lit={lit ? "" : undefined}>
              <button className={s.drName} aria-pressed={lit} onClick={() => m.setOpen(r)}>
                {DRUM_ROW_NAMES[r]}{doubtful && <span className={s.drOff}> off</span>}
              </button>
              <div className={s.drTrack}>
                <Pattern hits={rr?.hits ?? []} bars={bars} lit={lit} doubtful={doubtful} empty={off} />
              </div>
              <div className={s.drSlot}>
                {doubtful && !off
                  ? <button className={s.textBtn} title={rr?.why ?? undefined} onClick={() => m.playAnyway(r)}>Play anyway</button>
                  : <>{!lit && <span className={s.drPreset}>{DRUM_PRESETS[m.sounds[r].preset].name}</span>}{m.savedRows[r] && <span className={s.drSaved}>saved</span>}</>}
              </div>
            </div>
          );
        })}
        {loop?.state === "memory" && !off && <div className={s.drHeadBox}><Playhead heardMs={heardMs} loop={loop} bars={bars} /></div>}
      </div>
      <div className={s.drBlock}>
        <span className={s.drLabel}>{DRUM_ROW_NAMES[row]}</span>
        <DrumPreset m={m} row={row} />
        <div className={s.drKnobs} data-off={off ? "" : undefined}>
          {ROW_KNOBS[row].map((id) => (
            <Knob key={`${row}-${id}`} id={id} spec={DRUM_KNOB_SPECS[id]} wordOf={(v) => drumKnobWord(snd.preset, id, v, m.bpm)} value={snd.macros[id] ?? 0} sug={off ? undefined : ticks?.[id]}
              color="#f1e6d3" disabled={off} onChange={(v) => m.setKnob(row, id, v)} reset={clampDrumMacros(snd.preset, undefined)[id] ?? 0} size={88} />
          ))}
        </div>
        {wait ? <p className={s.drWait} role="status">{wait}</p> : (
          <div className={s.drSuggest}>
            <p className={s.suggest} aria-live="polite">{line}</p>
            {/* P6: local analysis by synthesis; it only moves the gold ticks. */}
            <button className={s.ghost} onClick={() => m.suggestNow(row)} disabled={!m.read?.targets[row] || m.suggesting !== null || m.suggestedNow[row]}
              title="Places gold ticks where the knobs come closest to the original; it never turns a knob">{m.suggesting === row ? "Suggesting…" : m.suggestedNow[row] ? "Suggested" : `Suggest for ${rowTitle(row)}`}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** The open row's preset: its name opens a menu of the row's presets and the row's saved sounds. */
function DrumPreset({ m, row }: { m: DrumsModel; row: DrumRow }) {
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
  const cur = m.sounds[row].preset;
  const mine = m.mySounds.filter((x) => DRUM_PRESETS[x.preset].row === row);
  return (
    <div className={s.preset} ref={box}>
      <button className={s.drPresetName} aria-haspopup="menu" aria-expanded={openMenu} onClick={() => setOpenMenu(!openMenu)} aria-label={`Preset: ${DRUM_PRESETS[cur].name}. Change preset`}>
        {DRUM_PRESETS[cur].name} <span aria-hidden>▾</span>
      </button>
      {openMenu && (
        <div className={s.menu} role="menu" aria-label={`${DRUM_ROW_NAMES[row]} presets`}>
          {ROW_PRESETS[row].map((id) => (
            <button key={id} role="menuitemradio" aria-checked={id === cur} className={s.menuItem} onClick={() => { setOpenMenu(false); if (id !== cur) m.setPreset(row, id); }}>
              <span className={s.menuCheck} aria-hidden>{id === cur ? "✓" : ""}</span>
              <span>{DRUM_PRESETS[id].name}</span>
              <small>{DRUM_PRESETS[id].tags.join(" · ")}</small>
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
                    <small>{DRUM_PRESETS[x.preset].name}</small>
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

/** A/B at the same loudness, the bass under both (P7), and the closeness score (P8). */
export function DrumsCheck({ m }: { m: DrumsModel }) {
  return (
    <div className={s.checkRow}>
      <div className={s.abWrap}>
        <div className={s.ab} role="group" aria-label="Compare at the same loudness">
          <button aria-pressed={m.ab === "a"} onClick={() => m.setAb("a")}>A · Original drums</button>
          <button aria-pressed={m.ab === "b"} onClick={() => m.setAb("b")} disabled={!m.mineAny} title={m.mineAny ? undefined : "Mine plays once the loop is read"}>B · Mine</button>
        </div>
        <span className={s.faint}>same loudness</span>
      </div>
      <button className={s.ghost} aria-pressed={m.bed} onClick={() => m.setBed(!m.bed)} title="Plays the original bass under both A and B, so you judge the drums in the groove">{m.bed ? "Bass under both: on" : "Bass under both: off"}</button>
      <span className={s.drScore} title="How close Mine's three rows measure to the original drums: where each row's energy moves, where it hits, and the band balance. Numbers only.">
        closeness <b>{m.closeness ? m.closeness.score : "–"}</b> / 100
      </span>
    </div>
  );
}

/** Save the open row ("Save kick"); rows show "✓ saved". */
export function DrumsSaveBar({ m }: { m: DrumsModel }) {
  const row = m.open;
  const label = `Save ${drumNoun(m.sounds[row].preset)}`;
  const off = !m.on[row] && m.readState === "ready";
  return (
    <div className={s.saveBar}>
      <label className={s.saveLabel} htmlFor="save-name">Name</label>
      <input id="save-name" name="sound-name" autoComplete="off" spellCheck={false} className={s.input} value={m.name} maxLength={60} onChange={(e) => m.setName(e.target.value)} disabled={m.readState !== "ready"} />
      <span className={s.facts} title={m.tags.join(" · ")}>{m.tags.join(" · ")}</span>
      <span className={s.saved} role="status">{m.saved.state === "error" ? m.saved.text : off ? `This row is off in Mine` : m.saved.savedAs && m.saved.action === "none" ? `Saved as ${m.saved.savedAs}` : ""}</span>
      <button className={s.gold} onClick={() => void m.save()} disabled={!m.canSave}>{m.saved.state === "saving" ? "Saving…" : label}</button>
    </div>
  );
}
