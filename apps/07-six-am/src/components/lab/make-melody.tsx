"use client";

// Make for melody / chords (Phase 5 slice 2, P4, P6–P10; design Fold, round 3 fold-melody, L224–L233).
// The same room as Drums: rows of one fixed height on top (Chords; Lead only when the reader finds a
// separate line above the chords), the open row lit, the knob block anchored under them. Mine plays
// the rows' read notes with the poly synth, at the original's loudness; A/B against the original
// "other" part with the original drums under both by default (P7). The part is read off the main
// thread from a copy the worker zeroes (C2). Save saves the open row ("Save chords").
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { LabTransport, LoopState } from "@/lib/lab/transport";
import { MakeClient } from "@/lib/make/make-client";
import { chordNames, foldMelodyRow, type MelodyReading, type MelodyRowSound, type MelodyTarget } from "@/lib/make/melody-make";
import { isMelodySound, melodyNoun, saveAction, soundId, suggestMelodyName, suggestMelodyTags, type MelodySound } from "@/lib/make/library";
import { MELODY_ROWS, MELODY_ROW_NAMES, POLY_KNOBS, POLY_KNOB_SPECS, ROW_DEFAULT, clampPolyMacros, kindOf, melodyPreset, melodyPresetIds, melodyRowOf, polyKnobWord, polyMoves, polySuggestLine, presetId, type MelodyPresetId, type MelodyRow, type PolyMacros } from "@/lib/make/poly-synth";
import type { Scale } from "@/lib/synths/theory";
import { ApiError, mentorApi } from "@/lib/mentor/client";
import { Knob } from "@/components/ui/knob";
import { Playhead, useShort } from "./make-drums";
import s from "./lab.module.css";

const loopKeyOf = (l: LoopState | null) => (l?.state === "memory" ? `${Math.round(l.startMs)}-${Math.round(l.endMs)}` : null);
type ReadState = "idle" | "reading" | "ready" | "nonotes" | "error";
type Read = { loopKey: string; d: MelodyReading; targets: Record<MelodyRow, MelodyTarget | null>; levelDb: number; lufs: number; samples: number; rate: number };
type Sound = { preset: MelodyPresetId; macros: Required<PolyMacros> };
const fresh = (p: MelodyPresetId): Sound => ({ preset: p, macros: clampPolyMacros(p, undefined) });
const perRow = <T,>(f: (r: MelodyRow) => T) => Object.fromEntries(MELODY_ROWS.map((r) => [r, f(r)])) as Record<MelodyRow, T>;
const TEAL = "#23b3a5";

export type MelodyOpts = { tr: RefObject<LabTransport | null>; active: boolean; loop: LoopState | null; bpm: number; keyName: string; scale: string; code: string; title: string; url: string };

/** Everything Make's melody keeps while you switch family, or to Listen and back. */
export function useMelody(o: MelodyOpts) {
  const { tr } = o;
  const client = useRef<MakeClient | null>(null);
  const cl = () => (client.current ??= new MakeClient());
  useEffect(() => () => { client.current?.stop(); client.current = null; }, []);
  const loopKey = loopKeyOf(o.loop);
  const scale: Scale | null = o.scale === "major" || o.scale === "minor" ? o.scale : null;

  const [openS, setOpen] = useState<MelodyRow>("chords");
  const [sounds, setSounds] = useState<Record<MelodyRow, Sound>>(() => perRow((r) => fresh(presetId(r, ROW_DEFAULT[r]))));
  const [ticksS, setTicks] = useState<Record<MelodyRow, { for: string; macros: PolyMacros; moved: string | null } | null>>(() => perRow(() => null));
  const [suggesting, setSuggesting] = useState<MelodyRow | null>(null);
  const [readS, setReadS] = useState<Read | null>(null);
  const [state, setState] = useState<{ loopKey: string; state: ReadState; error?: string } | null>(null);
  const [anywayS, setAnyway] = useState<{ loopKey: string | null; rows: MelodyRow[] }>({ loopKey: null, rows: [] });
  const [ab, setAb] = useState<"a" | "b">("a");
  const [bed, setBed] = useState(true); // P7: the original drums under both A and B
  const [mineS, setMine] = useState<{ key: string; rowCloseness: Record<MelodyRow, { score: number; distance: number } | null>; gainDb: number; rowGainsDb: Record<MelodyRow, number | null>; ms: number } | null>(null);
  const [names, setNames] = useState<Record<MelodyRow, string | null>>(() => perRow(() => null));
  const [last, setLast] = useState<Record<MelodyRow, { id: string; sound: string; name: string } | null>>(() => perRow(() => null));
  const [saveState, setSaveState] = useState<{ state: "idle" | "saving" | "error"; text?: string }>({ state: "idle" });
  const [mySounds, setMySounds] = useState<MelodySound[]>([]);

  const read = readS && readS.loopKey === loopKey ? readS : null;
  const readState: ReadState = state && state.loopKey === loopKey ? state.state : "idle";
  const rows: MelodyRow[] = read?.d.lead ? ["chords", "lead"] : ["chords"];
  const open: MelodyRow = rows.includes(openS) ? openS : "chords";
  const anyway = useMemo(() => (anywayS.loopKey === loopKey ? anywayS.rows : []), [anywayS, loopKey]);
  const on = useMemo(() => perRow((r) => !!read && read.d.rows[r].notes.length > 0 && (!read.d.rows[r].doubtful || anyway.includes(r))), [read, anyway]);
  const signature = (x: Record<MelodyRow, Sound>, onRows: Record<MelodyRow, boolean>) => MELODY_ROWS.map((r) => `${x[r].preset}:${POLY_KNOBS.map((k) => x[r].macros[k].toFixed(3)).join(",")}:${onRows[r] ? 1 : 0}`).join("|");
  const mineKeyNow = read ? `${read.loopKey}|${signature(sounds, on)}` : null;
  const mine = mineS && read && mineS.key.startsWith(`${read.loopKey}|`) ? mineS : null;

  const suggest = useCallback(async (r: Read, row: MelodyRow, snd: Sound, before: PolyMacros | null) => {
    const target = r.targets[row];
    if (!target) return;
    setSuggesting(row);
    try {
      const res = await cl().melodySuggest({ target, preset: snd.preset, bpm: o.bpm, start: before ? snd.macros : undefined });
      console.info(`[make] melody suggest ${row} ${snd.preset}: ${res.suggestion.renders} renders in ${res.ms} ms, distance ${res.suggestion.distance.toFixed(2)} (preset ${res.suggestion.presetDistance.toFixed(2)})`);
      const after = res.suggestion.macros;
      const moved = before ? POLY_KNOBS.filter((k) => Math.abs((after[k] ?? 0) - (before[k] ?? 0)) >= 0.05).map((k) => POLY_KNOB_SPECS[k].name) : null;
      setTicks((t) => ({ ...t, [row]: { for: soundId(snd.preset, snd.macros), macros: after, moved: moved === null ? null : moved.length ? `Ticks moved: ${moved.join(", ")}.` : "The ticks stayed where they were." } }));
    } catch (e) {
      console.warn("[make] melody suggest failed", e);
    } finally {
      setSuggesting(null);
    }
  }, [o.bpm]);

  // Read the looped "other" part once it's in memory: a copy goes to the worker, which zeroes it (C2).
  const readFor = state?.loopKey ?? null;
  const soundsRef = useRef(sounds);
  useEffect(() => { soundsRef.current = sounds; }, [sounds]);
  const startRead = useCallback((key: string) => {
    const held = tr.current?.loopPart(2);
    if (!held) return;
    setState({ loopKey: key, state: "reading" });
    setTicks(perRow(() => null));
    const left = held.left.slice(), right = held.right.slice();
    const samples = left.length, rate = held.rate;
    cl().melodyRead({ left, right, rate, bpm: o.bpm, key: o.keyName && scale ? { key: o.keyName, scale } : undefined }).then(async (res) => {
      const n = MELODY_ROWS.map((r) => res.reading.rows[r].notes.length);
      console.info(`[make] melody read in ${res.ms} ms: chords ${n[0]} notes, lead ${n[1]} notes, tuning ${res.reading.tuningCents} ct`);
      if (!n.some((x) => x > 0)) { setState({ loopKey: key, state: "nonotes" }); return; }
      const r: Read = { loopKey: key, d: res.reading, targets: res.targets, levelDb: res.levelDb, lufs: res.lufs, samples, rate };
      setReadS(r);
      setState({ loopKey: key, state: "ready" });
      for (const row of MELODY_ROWS) if (r.targets[row]) await suggest(r, row, soundsRef.current[row], null);
    }, (e) => setState({ loopKey: key, state: "error", error: `Make couldn't read the melody: ${e instanceof Error ? e.message : String(e)}` }));
  }, [o.bpm, o.keyName, scale, tr, suggest]);
  useEffect(() => {
    if (!o.active || !loopKey || readFor === loopKey) return;
    const t = setTimeout(() => startRead(loopKey), 0);
    return () => clearTimeout(t);
  }, [o.active, loopKey, readFor, startRead]);

  // Mine: the rows rendered together on every change (debounced), swapped in, in sync.
  useEffect(() => {
    if (!o.active || !read || !mineKeyNow || (mineKeyNow === mineS?.key && tr.current?.mineOwner === "melody")) return;
    const t = setTimeout(() => {
      const rowSounds: Record<MelodyRow, MelodyRowSound> = perRow((r) => ({ ...sounds[r], on: on[r] }));
      cl().melodyRender({ reading: read.d, sounds: rowSounds, targets: read.targets, bpm: o.bpm, rate: read.rate, samples: read.samples, levelDb: read.levelDb, lufs: read.lufs }).then(({ res, stale }) => {
        if (stale || loopKeyOf(tr.current?.state.loop ?? null) !== read.loopKey) return;
        tr.current?.setMine(res, "melody");
        setMine({ key: mineKeyNow, rowCloseness: res.rowCloseness, gainDb: res.gainDb, rowGainsDb: res.rowGainsDb, ms: res.ms });
      }, (e) => console.warn("[make] melody render failed", e));
    }, 80);
    return () => clearTimeout(t);
  }, [o.active, read, mineKeyNow, mineS?.key, sounds, on, o.bpm, tr]);

  useEffect(() => {
    if (!o.code || !o.url) return;
    let live = true;
    mentorApi(o.code).sounds({ source: o.url, part: "other" }).then((xs) => { if (live) setMySounds(xs.filter(isMelodySound) as MelodySound[]); }, () => { /* the menu just has none */ });
    return () => { live = false; };
  }, [o.code, o.url]);

  const setPreset = (row: MelodyRow, p: MelodyPresetId) => {
    const next = fresh(p); // re-picking the current preset resets its knobs (N4)
    setSounds((x) => ({ ...x, [row]: next }));
    setTicks((t) => ({ ...t, [row]: null }));
    if (read) void suggest(read, row, next, null);
  };
  const setKnob = (row: MelodyRow, id: keyof PolyMacros, v: number) => setSounds((x) => (x[row].macros[id] === v ? x : { ...x, [row]: { ...x[row], macros: { ...x[row].macros, [id]: v } } }));
  const loadSound = (x: MelodySound) => {
    const row = melodyRowOf(x.preset), snd = { preset: x.preset, macros: clampPolyMacros(x.preset, x.macros) };
    setSounds((s0) => ({ ...s0, [row]: snd }));
    setNames((n) => ({ ...n, [row]: x.name }));
    setLast((l) => ({ ...l, [row]: { id: x.id, sound: soundId(snd.preset, snd.macros), name: x.name } }));
    setTicks((t) => ({ ...t, [row]: null }));
    setOpen(row);
    if (read) void suggest(read, row, snd, null);
  };
  const playAnyway = (row: MelodyRow) => setAnyway({ loopKey, rows: [...anyway.filter((r) => r !== row), row] });
  const backToOff = (row: MelodyRow) => setAnyway({ loopKey, rows: anyway.filter((r) => r !== row) });

  // Save the open row (P9): its sound, and its notes folded to a 1–16-bar repeat, in the track's key.
  const cur = sounds[open], sid = soundId(cur.preset, cur.macros);
  const suggested = suggestMelodyName(cur.preset, cur.macros, o.title);
  const lastRow = last[open], nameRaw = names[open];
  const nameField = nameRaw === null || (lastRow && lastRow.sound !== sid && nameRaw === lastRow.name) ? suggested : nameRaw;
  const nameNow = nameField.trim() || suggested;
  const action = saveAction({ sound: sid, name: nameNow }, lastRow);
  const tags = scale && o.keyName ? suggestMelodyTags(cur.preset, o.keyName, scale, o.bpm, o.title, cur.macros) : [];
  const savedRows = perRow((r) => !!last[r] && last[r]!.sound === soundId(sounds[r].preset, sounds[r].macros));
  const canSave = readState === "ready" && on[open] && !!scale && !!o.keyName && saveState.state !== "saving" && action.kind !== "none";
  const save = async (row: MelodyRow = open, nameOverride?: string) => {
    if (!read || !scale || !o.keyName) return;
    const snd = sounds[row], id = soundId(snd.preset, snd.macros), lr = last[row];
    const nm = (nameOverride ?? (row === open ? nameNow : suggestMelodyName(snd.preset, snd.macros, o.title))).trim();
    const act = saveAction({ sound: id, name: nm }, lr);
    if (act.kind === "none" || !on[row]) return;
    setSaveState({ state: "saving" });
    try {
      const api = mentorApi(o.code);
      const res = act.kind === "patch"
        ? await api.patchSound(act.id, { name: nm })
        : await api.addSound({
          name: nm, part: "other", preset: snd.preset, macros: snd.macros, pattern: foldMelodyRow(read.d.rows[row].notes, read.d.steps),
          key: o.keyName, scale, bpm: o.bpm, source: { title: o.title, url: o.url }, tags: suggestMelodyTags(snd.preset, o.keyName, scale, o.bpm, o.title, snd.macros),
        });
      setLast((l) => ({ ...l, [row]: { id: res.id, sound: id, name: res.name } }));
      setNames((n) => ({ ...n, [row]: res.name }));
      if (isMelodySound(res)) setMySounds((xs) => [res as MelodySound, ...xs.filter((x) => x.id !== res.id)]);
      setSaveState({ state: "idle" });
    } catch (e) {
      setSaveState({ state: "error", text: e instanceof ApiError ? e.message : "Couldn't save. Try again." });
    }
  };

  const ticks = perRow((r) => (read ? ticksS[r] : null));
  return {
    open, setOpen, rows, sounds, setPreset, setKnob, ticks, suggesting, read, readState, readError: state?.error ?? null, on, anyway, playAnyway, backToOff,
    suggestNow: (row: MelodyRow) => { if (read) void suggest(read, row, sounds[row], ticks[row]?.macros ?? null); },
    suggestedNow: perRow((r) => !!ticks[r] && ticks[r]!.for === soundId(sounds[r].preset, sounds[r].macros)),
    ab, setAb, bed, setBed, mineReady: !!mine && mine.key === mineKeyNow, mineAny: !!mine, rowCloseness: mine?.rowCloseness ?? null,
    mySounds, loadSound, name: nameField, setName: (v: string) => setNames((n) => ({ ...n, [open]: v })), tags, save, canSave, savedRows,
    saved: { state: saveState.state, text: saveState.text, savedAs: lastRow && lastRow.sound === sid ? lastRow.name : null, action: action.kind },
    bpm: o.bpm,
    /** What the Lab Mentor gets with a question asked in Melody: the open row (numbers and ids). */
    labRow: { family: "melody" as const, preset: sounds[open].preset as string, knobs: sounds[open].macros as Record<string, number>, ticks: (ticks[open]?.macros ?? null) as Record<string, number> | null, off: !!read?.d.rows[open].doubtful && !anyway.includes(open), note: read?.d.rows[open].why ?? null },
    /** Graders (slice 2): what Make's melody holds now, numbers only. */
    debug: () => ({
      readState, open, rows, ab, bed, on, anyway, steps: read?.d.steps ?? null, lead: read?.d.lead ?? null, tuningCents: read?.d.tuningCents ?? null,
      reading: read ? perRow((r) => ({ notes: read.d.rows[r].notes, doubtful: read.d.rows[r].doubtful, why: read.d.rows[r].why, note: read.d.rows[r].note })) : null,
      levelDb: read?.levelDb ?? null, lufs: read?.lufs ?? null, sounds, ticks: perRow((r) => ticks[r]?.macros ?? null),
      mine: mine ? { ready: mine.key === mineKeyNow, gainDb: mine.gainDb, rowGainsDb: mine.rowGainsDb, rowCloseness: mine.rowCloseness, renderMs: mine.ms } : null,
      saved: perRow((r) => last[r]), mySounds: mySounds.map((x) => ({ id: x.id, name: x.name, preset: x.preset })),
    }),
  };
}
export type MelodyModel = ReturnType<typeof useMelody>;

// ── The middle (Fold, fold-melody) ──────────────────────────────────────────────────────────────

const W = 1000;

/** One row's notes as a piano roll: a block per bar, each note a bar at its pitch; doubtful rows hollow. */
function Roll({ notes, steps, bars, lit, doubtful, empty }: { notes: { step: number; off: number; durSteps: number; midi: number }[]; steps: number; bars: number; lit: boolean; doubtful: boolean; empty: boolean }) {
  const H = 60, gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars;
  const lo = notes.length ? Math.min(...notes.map((n) => n.midi)) : 0, hi = notes.length ? Math.max(...notes.map((n) => n.midi)) : 1, span = Math.max(6, hi - lo + 1);
  const x = (st: number) => { const b = Math.min(bars - 1, Math.floor(st / 16)); return b * (bw + gap) + ((st - b * 16) / 16) * bw; };
  const rh = Math.max(2, Math.min(6, H / span - 1));
  return (
    <svg className={s.melRoll} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      {Array.from({ length: bars }, (_, b) => <rect key={b} x={b * (bw + gap)} y={0} width={bw} height={H} fill="rgba(241,230,211,.04)" />)}
      {!empty && notes.filter((n) => n.step < steps).map((n, i) => {
        const x0 = x(n.step + n.off), w = Math.max(3, (Math.min(n.durSteps, 16) / 16) * bw - 1), y = H - ((n.midi - lo + 1) / span) * H * 0.9 - 3;
        return doubtful
          ? <rect key={i} x={x0} y={y} width={w} height={rh} fill="none" stroke={TEAL} strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity={0.8} />
          : <rect key={i} x={x0} y={y} width={w} height={rh} rx={1} fill={TEAL} opacity={lit ? 0.9 : 0.45} />;
      })}
    </svg>
  );
}

function waitLine(m: MelodyModel, loop: LoopState | null, playing: boolean): string | null {
  if (m.readState === "ready") return null;
  if (!loop) return "Loop a section first: Make builds your melody on a loop of the song.";
  const lenS = Math.round((loop.endMs - loop.startMs) / 1000);
  if (loop.state === "filling") {
    if (loop.laps >= 2) return "The loop isn't filling: the part splitter is running behind on this Mac. Loop a shorter section, or close other tabs, then press Play again.";
    if (!playing) return `Press Play. The loop fills from the song first (about ${lenS + 7} s), then your melody appears here.`;
    return `Filling the loop… ${loop.etaS ?? lenS} s`;
  }
  if (m.readState === "reading" || m.readState === "idle") return "Reading the notes… a second.";
  if (m.readState === "nonotes") return "No notes in this loop. Loop a section where the chords or a melody play.";
  return m.readError ?? "Press Play.";
}

/** What the Mentor calls a row's sound ("stabs", "pads", "keys", "plucks", "lead"). */
const nounOf = (id: MelodyPresetId) => (melodyRowOf(id) === "lead" ? "lead" : ({ stab: "stabs", pluck: "plucks", pad: "pads", keys: "keys" } as const)[kindOf(id)]);

export function MelodyMiddle({ m, loop, playing, heardMs }: { m: MelodyModel; loop: LoopState | null; playing: boolean; heardMs: () => number }) {
  const steps = m.read?.d.steps ?? (loop ? Math.max(16, Math.round((loop.endMs - loop.startMs) / (60000 / m.bpm / 4))) : 128);
  const bars = Math.max(1, Math.round(steps / 16));
  const gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars;
  const wait = waitLine(m, loop, playing), off = !!wait, short = useShort();
  const row = m.open, snd = m.sounds[row], rr = m.read?.d.rows[row], rowOff = !!rr?.doubtful && !m.anyway.includes(row);
  const ticks = m.ticks[row]?.macros;
  const chords = useMemo(() => (m.read ? chordNames(m.read.d.rows.chords.notes, m.read.d.steps) : []), [m.read]);
  let line: React.ReactNode;
  if (rowOff) line = <>{`Mentor: this row is off. ${(rr?.why ?? "").replace(/,? off in Mine$|: off in Mine$/, "")}.`}<br /><span className={s.faintLine}>Mine leaves it out. Press Play anyway to hear it.</span></>;
  else if (m.suggesting === row) line = `Measuring the ${nounOf(snd.preset)} against ${melodyPreset(snd.preset).name}…`;
  else if (!m.read?.targets[row]) line = <span className={s.faintLine}>Not enough clear notes in this row to compare with.</span>;
  else if (!ticks) line = `Mentor: press Suggest for ${MELODY_ROW_NAMES[row].toLowerCase()} to compare this preset with the original.`;
  else line = <>Mentor: {polySuggestLine(snd.preset, snd.macros, ticks, nounOf(snd.preset))}{m.ticks[row]?.moved && polyMoves(snd.macros, ticks).length > 0 ? <><br /><span className={s.faintLine}>{m.ticks[row]!.moved}</span></> : null}</>;
  return (
    <div className={s.drums}>
      <div className={s.drRows} role="group" aria-label="Melody rows">
        <div className={s.drRow} data-head="">
          <span />
          <div className={s.drBars} aria-hidden>
            {chords.map((c) => <span key={c.bar} style={{ left: `${((c.bar * (bw + gap)) / W) * 100}%`, color: "var(--ink)" }}>{c.name}</span>)}
          </div>
          <span />
        </div>
        {m.rows.map((r) => {
          const x = m.read?.d.rows[r], lit = r === row, doubtful = !!x?.doubtful && !m.anyway.includes(r);
          return (
            <div key={r} className={s.drRow} data-lit={lit ? "" : undefined} data-tall="">
              <button className={s.drName} aria-pressed={lit} onClick={() => m.setOpen(r)}>
                {MELODY_ROW_NAMES[r]}{doubtful && <span className={s.drOff}> off</span>}
              </button>
              <div className={s.drTrack}>
                <Roll notes={x?.notes ?? []} steps={steps} bars={bars} lit={lit} doubtful={doubtful} empty={off} />
                {!off && x?.doubtful && x.note && <span className={s.drNote}>{x.note}</span>}
              </div>
              <div className={s.drSlot}>
                {!off && x?.doubtful
                  ? doubtful
                    ? <button className={s.textBtn} title={x.why ?? undefined} onClick={() => m.playAnyway(r)}>Play anyway</button>
                    : <button className={s.textBtn} title="Leave this row out of Mine again, as the reading suggests" onClick={() => m.backToOff(r)}>Back to off</button>
                  : <>{!lit && <span className={s.drPreset}>{melodyPreset(m.sounds[r].preset).name}</span>}{m.savedRows[r] && <span className={s.drSaved}>saved</span>}</>}
              </div>
            </div>
          );
        })}
        {loop?.state === "memory" && !off && <div className={s.drHeadBox}><Playhead heardMs={heardMs} loop={loop} bars={bars} /></div>}
      </div>
      <div className={s.drBlock}>
        <span className={s.drLabel}>{MELODY_ROW_NAMES[row]}</span>
        <MelodyPreset m={m} row={row} />
        <div className={s.drKnobs} data-off={off ? "" : undefined} style={{ gap: short ? 24 : 40 }}>
          {POLY_KNOBS.map((id) => (
            <Knob key={`${row}-${id}`} id={id as never} spec={POLY_KNOB_SPECS[id]} wordOf={(v) => polyKnobWord(snd.preset, id, v)} value={snd.macros[id]} sug={off || rowOff ? undefined : ticks?.[id]}
              color={TEAL} disabled={off} onChange={(v) => m.setKnob(row, id, v)} reset={clampPolyMacros(snd.preset, undefined)[id]} size={short === 2 ? 64 : short === 1 ? 72 : 88} />
          ))}
        </div>
        {wait ? <p className={s.drWait} role="status">{wait}</p> : (
          <div className={s.drSuggest}>
            <p className={s.suggest} aria-live="polite">{line}</p>
            {rowOff ? null : m.suggestedNow[row] && m.suggesting !== row
              ? <span className={s.drPlaced} role="status">Ticks placed</span>
              : <button className={s.ghost} onClick={() => m.suggestNow(row)} disabled={!m.read?.targets[row] || m.suggesting !== null}
                title="Places gold ticks where the knobs come closest to the original; it never turns a knob">{m.suggesting === row ? "Suggesting…" : `Suggest for ${MELODY_ROW_NAMES[row].toLowerCase()}`}</button>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Where a preset's saved sound lands in the Studio (P9: a pad goes on Pads). */
const laneHint = (id: MelodyPresetId) => (melodyRowOf(id) === "lead" ? "Lead lane" : kindOf(id) === "pad" ? "Pads lane" : "Chords lane");

function MelodyPreset({ m, row }: { m: MelodyModel; row: MelodyRow }) {
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
  const mine = m.mySounds.filter((x) => melodyRowOf(x.preset) === row);
  return (
    <div className={s.preset} ref={box}>
      <button className={s.drPresetName} aria-haspopup="menu" aria-expanded={openMenu} onClick={() => setOpenMenu(!openMenu)} aria-label={`Preset: ${melodyPreset(cur).name}. Change preset`}>
        {melodyPreset(cur).name} <span aria-hidden>▾</span>
      </button>
      {openMenu && (
        <div className={s.menu} role="menu" aria-label={`${MELODY_ROW_NAMES[row]} presets`}>
          {melodyPresetIds(row).map((id) => (
            <button key={id} role="menuitemradio" aria-checked={id === cur} className={s.menuItem} onClick={() => { setOpenMenu(false); m.setPreset(row, id); }}>
              <span className={s.menuCheck} aria-hidden>{id === cur ? "✓" : ""}</span>
              <span>{melodyPreset(id).name}</span>
              <small>{laneHint(id)} · {melodyPreset(id).tags.join(" · ")}</small>
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
                    <small>{melodyPreset(x.preset).name}</small>
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

/** A/B at the same loudness, the drums under both (P7), the open row's closeness (L233). */
export function MelodyCheck({ m }: { m: MelodyModel }) {
  const off = !!m.read?.d.rows[m.open].doubtful && !m.anyway.includes(m.open);
  return (
    <div className={`${s.checkRow} ${s.drCheck}`}>
      <div className={s.abWrap}>
        <div className={s.ab} role="group" aria-label="Compare at the same loudness">
          <button aria-pressed={m.ab === "a"} onClick={() => m.setAb("a")}>A · Original melody</button>
          <button aria-pressed={m.ab === "b"} onClick={() => m.setAb("b")} disabled={!m.mineAny} title={m.mineAny ? undefined : "Mine plays once the loop is read"}>B · Mine</button>
        </div>
        <span className={s.faint}>same loudness</span>
      </div>
      <button className={s.ghost} aria-pressed={m.bed} onClick={() => m.setBed(!m.bed)} title="Plays the original drums under both A and B, so you judge the chords in the groove">{m.bed ? "Drums under both: on" : "Drums under both: off"}</button>
      <span className={s.drScore} title="How close this row's notes sound to the original's (the same notes on both sides: their spectrum, envelope, room and width): it rises as you follow this row's gold ticks. Numbers only.">
        closeness · {MELODY_ROW_NAMES[m.open].toLowerCase()} <b>{off ? "–" : m.rowCloseness?.[m.open]?.score ?? "–"}</b> / 100
      </span>
    </div>
  );
}

/** Save the open row ("Save chords", "Save lead"); rows show "✓ saved". */
export function MelodySaveBar({ m }: { m: MelodyModel }) {
  const row = m.open, off = !m.on[row] && m.readState === "ready";
  return (
    <div className={s.saveBar}>
      <label className={s.saveLabel} htmlFor="save-name">Name</label>
      <input id="save-name" name="sound-name" autoComplete="off" spellCheck={false} className={s.input} value={m.name} maxLength={60} onChange={(e) => m.setName(e.target.value)} disabled={m.readState !== "ready"} />
      <span className={s.facts} title={m.tags.join(" · ")}>{m.tags.join(" · ")}</span>
      <span className={s.saved} role="status">{m.saved.state === "error" ? m.saved.text : off ? "This row is off in Mine" : m.saved.savedAs && m.saved.action === "none" ? `Saved as ${m.saved.savedAs}` : ""}</span>
      <button className={s.gold} onClick={() => void m.save()} disabled={!m.canSave}>{m.saved.state === "saving" ? "Saving…" : `Save ${melodyNoun(m.sounds[row].preset) === "lead" ? "lead" : "chords"}`}</button>
    </div>
  );
}
