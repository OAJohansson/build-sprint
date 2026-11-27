"use client";

// Make for drums (Phase 5 slice 1, P1, P3, P6–P10; design Fold, round 3 + round 4, L224–L226,
// T116–T124). Three rows of one fixed height on top (kick, clap & snare, hats), the open row lit;
// the knob block (row name, preset, knobs, Mentor line and Suggest) anchored under them, so picking
// a row moves nothing. Mine plays the three rows together over the loop, in its timing (swing kept,
// L215), at the original's loudness; A/B against the original drum part, the original bass under
// both by default (P7). The drum part is read off the main thread from a copy that the worker zeroes
// (C2): only numbers come back. Save saves the open row ("Save kick") to My sounds.
// Phase 7 slice 1 (L266, L267, L272, L278, R1, R2): each row starts from 20 sampled sounds on a shelf
// under the rows (family groups, a feel word each; a tap plays it in the loop, or alone when the loop
// is stopped), the picked sound's name and plain line above, its four knobs (Pitch, Length, Tone,
// Drive) beside it, and the sound credits one click away. A saved synth sound still opens as it was.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import type { LabTransport, LoopState } from "@/lib/lab/transport";
import { DRUM_ROWS, clampDrumMacros, drumKnobDetail, drumKnobSpec, drumKnobWord, drumMoves, drumSoundAbout, drumSoundName, drumSuggestLine, isDrumPreset, isKitId, knobsOf, rowOf, type DrumMacros, type DrumRow, type DrumSoundId } from "@/lib/make/drum-synth";
import { KIT_ROW_FOR, ROW_SCORE_SCALE, foldRow, rowCandidates, type DrumsCloseness, type DrumsReading, type DrumsReport, type RowSound, type RowTarget } from "@/lib/make/drums-make";
import { MakeClient } from "@/lib/make/make-client";
import { P7_FAMILIES, P7_ROW_NAMES, p7SoundById, p7Sounds } from "@/lib/make/kit-p7";
import { hasKitSample } from "@/lib/make/kit-samples";
import { loadSample, loadSamples, previewDrum } from "@/lib/make/kit-load";
import { drumNoun, isDrumSound, saveAction, soundId, suggestDrumName, suggestDrumTags, type DrumSound } from "@/lib/make/library";
import { ApiError, mentorApi } from "@/lib/mentor/client";
import { Knob } from "@/components/ui/knob";
import { SoundCredits } from "./sound-credits";
import { ShelfGroups } from "./shelf-groups";
import s from "./lab.module.css";

const loopKeyOf = (l: LoopState | null) => (l?.state === "memory" ? `${Math.round(l.startMs)}-${Math.round(l.endMs)}` : null);
type ReadState = "idle" | "reading" | "ready" | "nohits" | "error";
type Read = { loopKey: string; d: DrumsReading; targets: Record<DrumRow, RowTarget | null>; report: DrumsReport; levelDb: number; lufs: number; samples: number; rate: number };
type Sound = { preset: DrumSoundId; macros: DrumMacros };
/** Phase 7 (design, L278): each row starts on a sampled sound that suits house (a round kick, the 909 clap, the 909 closed hat). */
const HOME: Record<DrumRow, DrumSoundId> = { kick: "kick-house-bounce", clap: "clap-909-clap", hats: "hat-909-closed" };
const fresh = (p: DrumSoundId): Sound => ({ preset: p, macros: clampDrumMacros(p, undefined) });
const perRow = <T,>(f: (r: DrumRow) => T) => Object.fromEntries(DRUM_ROWS.map((r) => [r, f(r)])) as Record<DrumRow, T>;
/** Phase 7: what a row is called next to its starting sounds (the kit's words: the Hats row plays the closed hats). */
const shelfRowName = (r: DrumRow) => P7_ROW_NAMES[KIT_ROW_FOR[r]];
/** D7-6: the row in a sentence, in the shelf's words ("Suggest for closed hat"). */
const rowTitle = (r: DrumRow) => shelfRowName(r).toLowerCase();
/** The recordings a set of sounds plays from (synth presets have none). */
const kitIdsOf = (xs: Sound[]) => xs.map((x) => x.preset).filter(isKitId);

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
  const [ticksS, setTicks] = useState<Record<DrumRow, { for: string; macros: DrumMacros; moved: string | null; closer?: { preset: DrumSoundId; distance: number; own: number } | null } | null>>(() => perRow(() => null));
  const [suggesting, setSuggesting] = useState<DrumRow | null>(null);
  const [readS, setReadS] = useState<Read | null>(null);
  const [state, setState] = useState<{ loopKey: string; state: ReadState; error?: string } | null>(null);
  const [anywayS, setAnyway] = useState<{ loopKey: string | null; rows: DrumRow[] }>({ loopKey: null, rows: [] });
  const [ab, setAb] = useState<"a" | "b">("a");
  const [bed, setBed] = useState(true); // P7: the original bass under both A and B
  const [mineS, setMine] = useState<{ key: string; closeness: DrumsCloseness; rowCloseness: Record<DrumRow, { score: number; distance: number } | null>; gainDb: number; rowGainsDb: Record<DrumRow, number | null>; ms: number } | null>(null);
  const [names, setNames] = useState<Record<DrumRow, string | null>>(() => perRow(() => null));
  const [last, setLast] = useState<Record<DrumRow, { id: string; sound: string; name: string } | null>>(() => perRow(() => null));
  const [saveState, setSaveState] = useState<{ state: "idle" | "saving" | "error"; text?: string }>({ state: "idle" });
  const [mySounds, setMySounds] = useState<DrumSound[]>([]);
  // Phase 7: bumped when recordings finish loading, so Mine renders again with them; and the last tap (W12, for the dev hook).
  const [samplesV, setSamplesV] = useState(0);
  const [tap, setTap] = useState<{ id: string; at: number; heardMs: number | null } | null>(null);
  const [shelf, setShelf] = useState(true);

  const read = readS && readS.loopKey === loopKey ? readS : null;
  const readState: ReadState = state && state.loopKey === loopKey ? state.state : "idle";
  const anyway = useMemo(() => (anywayS.loopKey === loopKey ? anywayS.rows : []), [anywayS, loopKey]);
  const on = useMemo(() => perRow((r) => !!read && read.d.rows[r].hits.length > 0 && (!read.d.rows[r].doubtful || anyway.includes(r))), [read, anyway]);
  // A row whose recording hasn't loaded yet isn't in the signature as ready, so Mine renders again once it is.
  const signature = (x: Record<DrumRow, Sound>, onRows: Record<DrumRow, boolean>) => DRUM_ROWS.map((r) => `${x[r].preset}:${knobsOf(x[r].preset).map((k) => (x[r].macros[k] ?? 0).toFixed(3)).join(",")}:${onRows[r] ? 1 : 0}:${isKitId(x[r].preset) && !hasKitSample(x[r].preset) ? "wait" : "ok"}`).join("|");
  void samplesV; // a re-render after a load recomputes the signature
  const mineKeyNow = read ? `${read.loopKey}|${signature(sounds, on)}` : null;
  const mine = mineS && read && mineS.key.startsWith(`${read.loopKey}|`) ? mineS : null;


  const suggest = useCallback(async (r: Read, row: DrumRow, snd: Sound, before: DrumMacros | null) => {
    const target = r.targets[row];
    if (!target) return;
    setSuggesting(row);
    try {
      // L272: Suggest searches the row's 20 starting sounds, so their recordings load first (once).
      const candidates = rowCandidates(row);
      await loadSamples([...candidates, ...kitIdsOf([snd])]);
      const res = await cl().drumsSuggest({ target, preset: snd.preset, start: before ? snd.macros : undefined, candidates }, [...candidates, ...kitIdsOf([snd])]);
      console.info(`[make] drums suggest ${row} ${snd.preset}: ${res.suggestion.renders} renders in ${res.ms} ms, distance ${res.suggestion.distance.toFixed(2)} (preset ${res.suggestion.presetDistance.toFixed(2)})`);
      const after = res.suggestion.macros;
      const moved = before ? knobsOf(snd.preset).filter((k) => Math.abs((after[k] ?? 0) - (before[k] ?? 0)) >= 0.05).map((k) => drumKnobSpec(snd.preset, k).name) : null;
      // N2: another preset of the row that gets clearly closer at its best.
      const closer = res.suggestion.closer ? { preset: res.suggestion.closer.preset, distance: res.suggestion.closer.distance, own: res.suggestion.distance } : null;
      setTicks((t) => ({ ...t, [row]: { for: soundId(snd.preset, snd.macros), macros: after, closer, moved: moved === null ? null : moved.length ? `Ticks moved: ${moved.join(", ")}.` : "The ticks stayed where they were." } }));
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
    // Phase 7: load a row's recording first (its first tap); Mine renders once it is in.
    const need = kitIdsOf(DRUM_ROWS.filter((r) => on[r]).map((r) => sounds[r])).filter((id) => !hasKitSample(id));
    if (need.length) { void loadSamples(need).then(() => setSamplesV((v) => v + 1)); return; }
    const t = setTimeout(() => {
      const levels = perRow((r) => read.targets[r]?.levelDb ?? null);
      const rowSounds: Record<DrumRow, RowSound> = perRow((r) => ({ ...sounds[r], on: on[r] }));
      cl().drumsRender({ reading: read.d, sounds: rowSounds, levels, report: read.report, bpm: o.bpm, rate: read.rate, samples: read.samples, levelDb: read.levelDb, lufs: read.lufs, targets: read.targets }, kitIdsOf(DRUM_ROWS.map((r) => sounds[r]))).then(({ res, stale }) => {
        if (stale || loopKeyOf(tr.current?.state.loop ?? null) !== read.loopKey) return;
        tr.current?.setMine(res, "drums");
        // W12: when the tapped sound first plays in Mine (ms after the tap), for the dev hook.
        setTap((x) => (x && x.heardMs === null && DRUM_ROWS.some((r) => sounds[r].preset === x.id) ? { ...x, heardMs: Math.round(performance.now() - x.at) } : x));
        setMine({ key: mineKeyNow, closeness: res.closeness, rowCloseness: res.rowCloseness, gainDb: res.gainDb, rowGainsDb: res.rowGainsDb, ms: res.ms });
      }, (e) => console.warn("[make] drums render failed", e));
    }, 60);
    return () => clearTimeout(t);
  }, [o.active, read, mineKeyNow, mineS?.key, sounds, on, o.bpm, tr]);

  // Phase 7 (W12): the rows' current recordings load as soon as Drums opens, before the loop is read.
  useEffect(() => {
    if (!o.active) return;
    const need = kitIdsOf(DRUM_ROWS.map((r) => soundsRef.current[r])).filter((id) => !hasKitSample(id));
    if (need.length) void loadSamples(need).then(() => setSamplesV((v) => v + 1));
  }, [o.active]);

  // This track's drum sounds in the library (numbers only), for each row's preset menu.
  useEffect(() => {
    if (!o.code || !o.url) return;
    let live = true;
    mentorApi(o.code).sounds({ source: o.url, part: "drums" }).then((xs) => { if (live) setMySounds(xs.filter(isDrumSound) as DrumSound[]); }, () => { /* the menu just has none */ });
    return () => { live = false; };
  }, [o.code, o.url]);

  const setPreset = (row: DrumRow, p: DrumSoundId) => {
    const next = fresh(p);
    setSounds((x) => ({ ...x, [row]: next }));
    setTicks((t) => ({ ...t, [row]: null }));
    if (read) void suggest(read, row, next, null);
  };
  const setKnob = (row: DrumRow, id: keyof DrumMacros, v: number) => setSounds((x) => (x[row].macros[id] === v ? x : { ...x, [row]: { ...x[row], macros: { ...x[row].macros, [id]: v } } }));
  /**
   * A tap on the shelf (Phase 7): the row plays this sound, in the loop (B · Mine) when it plays, or
   * one hit on its own when it's stopped; its recording loads on the first tap.
   */
  const pick = (row: DrumRow, id: DrumSoundId, playing: boolean) => {
    setTap({ id, at: performance.now(), heardMs: null });
    if (sounds[row].preset !== id) setPreset(row, id);
    if (playing && read) { setAb("b"); void loadSample(id).then(() => setSamplesV((v) => v + 1)); }
    else void previewDrum(id, clampDrumMacros(id, undefined)).then(() => setTap((x) => (x && x.id === id && x.heardMs === null ? { ...x, heardMs: Math.round(performance.now() - x.at) } : x)));
  };
  const loadSound = (x: DrumSound) => {
    const row = rowOf(x.preset);
    const snd = { preset: x.preset, macros: clampDrumMacros(x.preset, x.macros) };
    setSounds((s0) => ({ ...s0, [row]: snd }));
    setNames((n) => ({ ...n, [row]: x.name }));
    setLast((l) => ({ ...l, [row]: { id: x.id, sound: soundId(snd.preset, snd.macros), name: x.name } }));
    setTicks((t) => ({ ...t, [row]: null }));
    setOpen(row);
    if (read) void suggest(read, row, snd, null);
  };
  const playAnyway = (row: DrumRow) => setAnyway({ loopKey, rows: [...anyway.filter((r) => r !== row), row] });
  // U3: "Play anyway" is undone with "Back to off" (the reading's call again).
  const backToOff = (row: DrumRow) => setAnyway({ loopKey, rows: anyway.filter((r) => r !== row) });

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
  const tags = suggestDrumTags(cur.preset, o.bpm, o.title, cur.macros);
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
          key: o.keyName, scale, bpm: o.bpm, source: { title: o.title, url: o.url }, tags: suggestDrumTags(snd.preset, o.bpm, o.title, snd.macros),
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
    open, setOpen, sounds, setPreset, pick, shelf, setShelf, setKnob, ticks, suggesting, read, readState, readError: state?.error ?? null, on, anyway, playAnyway, backToOff,
    suggestNow: (row: DrumRow) => { if (read) void suggest(read, row, sounds[row], ticks[row]?.macros ?? null); },
    suggestedNow: perRow((r) => !!ticks[r] && ticks[r]!.for === soundId(sounds[r].preset, sounds[r].macros)),
    ab, setAb, bed, setBed, mineReady: !!mine && mine.key === mineKeyNow, mineAny: !!mine, closeness: mine?.closeness ?? null, rowCloseness: mine?.rowCloseness ?? null,
    /** M-F3: no row is on in Mine (every row off as doubtful): B would play silence. */
    allOff: !!read && !DRUM_ROWS.some((r) => on[r]),
    mySounds, loadSound, name: nameField, setName: (v: string) => setNames((n) => ({ ...n, [open]: v })), tags, save, canSave, savedRows,
    saved: { state: saveState.state, text: saveState.text, savedAs: lastRow && lastRow.sound === sid ? lastRow.name : null, action: action.kind },
    bpm: o.bpm,
    /** What the Lab Mentor gets with a question asked in Drums: the open row (numbers and ids; words on the server). */
    labRow: { family: "drums" as const, preset: sounds[open].preset, knobs: sounds[open].macros as Record<string, number>, ticks: (ticks[open]?.macros ?? null) as Record<string, number> | null, off: !!read?.d.rows[open].doubtful && !anyway.includes(open), note: read?.d.rows[open].why ?? null },
    /** Graders (Phase 5): what Make's drums hold now, numbers only. */
    debug: () => ({
      readState, open, ab, bed, on, anyway, steps: read?.d.steps ?? null, gridMs: read?.d.gridMs ?? null, swingMs: read?.d.swingMs ?? null,
      rows: read ? perRow((r) => ({ hits: read.d.rows[r].hits, doubtful: read.d.rows[r].doubtful, why: read.d.rows[r].why })) : null,
      targets: read?.targets ?? null, levelDb: read?.levelDb ?? null, lufs: read?.lufs ?? null,
      sounds, ticks: perRow((r) => ticks[r]?.macros ?? null), mine: mine ? { ready: mine.key === mineKeyNow, gainDb: mine.gainDb, rowGainsDb: mine.rowGainsDb, closeness: mine.closeness, rowCloseness: mine.rowCloseness, renderMs: mine.ms } : null,
      saved: perRow((r) => last[r]), mySounds: mySounds.map((x) => ({ id: x.id, name: x.name, preset: x.preset })),
      // Phase 7: the picked sound per row with its family and feel, and the last tap's time to sound (W12).
      picked: perRow((r) => ({ id: sounds[r].preset, name: drumSoundName(sounds[r].preset), family: p7SoundById(sounds[r].preset)?.family ?? "synth", feel: p7SoundById(sounds[r].preset)?.feel ?? null, loaded: !isKitId(sounds[r].preset) || hasKitSample(sounds[r].preset), macros: sounds[r].macros })),
      tap,
    }),
  };
}
export type DrumsModel = ReturnType<typeof useDrums>;

// ── The middle (Fold) ───────────────────────────────────────────────────────────────────────────

/** D-P1, D-R2: a short window gets smaller knobs: ≤ 860 px tall 72 px, ≤ 760 px 64 px (lab.module.css tiers). */
const SHORT = "(max-height: 860px)", SHORTER = "(max-height: 760px)";
const onShort = (cb: () => void) => {
  const ms = [matchMedia(SHORT), matchMedia(SHORTER)];
  ms.forEach((m) => m.addEventListener("change", cb));
  return () => ms.forEach((m) => m.removeEventListener("change", cb));
};
export const useShort = () => useSyncExternalStore(onShort, () => (matchMedia(SHORTER).matches ? 2 : matchMedia(SHORT).matches ? 1 : 0), () => 0);

const W = 1000; // the pattern's drawing units across (scaled to the column)
/** "Mentor:" lines start with a capital, whatever follows (C7). */
export const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** C2: the off row's reason in two or three words, under its label. */
export const shortWhy = (note: string) => (/bleed/i.test(note) ? "likely bleed" : /noise build|no repeating/i.test(note) ? "no steady beat" : note.split(":")[0].toLowerCase());

/**
 * C1 (critic, 13 Nov): a long loop draws as two lines of 8 bars in every row (same row height, thinner
 * lines), so a 16-bar loop's hits keep a readable width instead of 1 px hairlines and a hat smear.
 * `at(b)`: where bar position b (fractional) sits: its line and x in drawing units.
 */
export function stripGeom(bars: number, H = 38) {
  const perLine = bars > 8 ? 8 : bars, lines = Math.ceil(bars / perLine), lgap = 4;
  const gap = 8, bw = (W - gap * (perLine - 1)) / perLine, lh = (H - lgap * (lines - 1)) / lines;
  const at = (b: number) => { const i = Math.min(bars - 1, Math.max(0, Math.floor(b))), line = Math.floor(i / perLine), c = i % perLine; return { line, x: c * (bw + gap) + (b - i) * bw, y: line * (lh + lgap) }; };
  return { perLine, lines, gap, bw, lh, at };
}

/** One row's pattern: a block per bar, its hits as bars by velocity; an off row's marks drawn faint. */
function Pattern({ hits, bars, lit, doubtful, empty }: { hits: { step: number; vel: number; faint: boolean }[]; bars: number; lit: boolean; doubtful: boolean; empty: boolean }) {
  const H = 38, g = stripGeom(bars, H), sw = g.bw / 16;
  return (
    <svg className={s.drPattern} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      {Array.from({ length: bars }, (_, b) => {
        const p = g.at(b);
        return (
          <g key={b}>
            <rect x={p.x} y={p.y} width={g.bw} height={g.lh} fill="rgba(241,230,211,.04)" />
            {[4, 8, 12].map((q) => <rect key={q} x={p.x + q * sw - 0.5} y={p.y + g.lh * 0.25} width={1} height={g.lh * 0.5} fill="rgba(241,230,211,.07)" />)}
          </g>
        );
      })}
      {!empty && hits.map((h) => {
        // ≥ 2 px at a 1440 px window (the strip is ~730 px for 1000 units): at least 3 units wide.
        const p = g.at(Math.floor(h.step / 16)), x = p.x + (h.step % 16) * sw, hh = Math.max(3, g.lh * (0.3 + 0.7 * h.vel)), ww = Math.max(3, sw - 2);
        // C3: an off row's marks are much fainter, solid, so they don't read as a real pattern.
        return <rect key={h.step} x={x + 0.75} y={p.y + g.lh - hh} width={ww} height={hh} fill="#f2b134" opacity={doubtful ? 0.16 : lit ? 0.4 + 0.6 * h.vel : 0.45} />;
      })}
    </svg>
  );
}

/** The playhead over the rows: where the loop is now, across bar blocks with their gaps (one line of bars). */
export function Playhead({ heardMs, loop, bars }: { heardMs: () => number; loop: LoopState; bars: number }) {
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

/** C1: the playhead inside one drum strip, on the line of bars it is in (two lines on a 16-bar loop). */
function TrackHead({ heardMs, loop, bars }: { heardMs: () => number; loop: LoopState; bars: number }) {
  const el = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    let raf = 0;
    const H = 38, g = stripGeom(bars, H);
    const tick = () => {
      const f = (heardMs() - loop.startMs) / (loop.endMs - loop.startMs);
      const e = el.current;
      if (e) {
        const inside = f >= 0 && f < 1;
        e.style.display = inside ? "" : "none";
        if (inside) { const p = g.at(f * bars); e.style.left = `${(p.x / W) * 100}%`; e.style.top = `${(p.y / H) * 100}%`; e.style.height = `${(g.lh / H) * 100}%`; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heardMs, loop.startMs, loop.endMs, bars]);
  return <i ref={el} className={s.drTrackHead} aria-hidden />;
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
  const geo = stripGeom(bars), every = geo.perLine > 4 && geo.lines > 1 ? 4 : 1;
  const wait = waitLine(m, loop, playing);
  const off = !!wait;
  const row = m.open, snd = m.sounds[row], ticks = m.ticks[row]?.macros;
  const noun = drumNoun(snd.preset);
  let line: React.ReactNode;
  const rowRead = m.read?.d.rows[row], rowOff = !!rowRead?.doubtful && !m.anyway.includes(row);
  // U4: a row that is off gets the reason, not knob tips.
  // C2: the row says "off" once (its label); the Mentor line says why, in one line.
  if (rowOff) line = `Mentor: ${cap((rowRead?.why ?? "").replace(/: off in Mine$/, ""))}, so Mine leaves this row out.`;
  else if (m.suggesting === row) line = `Measuring the ${noun} against the row's 20 sounds…`;
  else if (!m.read?.targets[row]) line = <span className={s.faintLine}>No {rowTitle(row)} hits in this loop to compare with.</span>;
  else if (!ticks) line = `Mentor: Press Suggest for ${rowTitle(row)} to compare this sound with the original.`;
  else {
    const closer = m.ticks[row]?.closer;
    line = <>Mentor: {cap(drumSuggestLine(snd.preset, snd.macros, ticks, noun, m.bpm))}
      {/* U7-5: a clearly closer sound is offered on the shelf, under the sound's name (Shelf). */}
      {!closer && m.ticks[row]?.moved && drumMoves(knobsOf(snd.preset), snd.macros, ticks).length > 0 ? <><br /><span className={s.faintLine}>{m.ticks[row]!.moved}</span></> : null}</>;
  }
  return (
    <div className={s.drums}>
      <div className={s.drRows} role="group" aria-label="Drum rows">
        <div className={s.drRow} data-head="">
          <span />
          <div className={s.drBars} aria-hidden>
            {/* C1: on two lines, each mark names the bar on the top line and the one under it ("17 / 25"). */}
            {from !== null && Array.from({ length: geo.perLine }, (_, b) => b).filter((b) => b % every === 0).map((b) => <span key={b} style={{ left: `${((b * (geo.bw + geo.gap)) / W) * 100}%` }}>{from + b}{geo.lines > 1 ? ` / ${from + b + geo.perLine}` : ""}</span>)}
          </div>
          <span />
        </div>
        {DRUM_ROWS.map((r) => {
          const rr = m.read?.d.rows[r], lit = r === row, doubtful = !!rr?.doubtful && !m.anyway.includes(r);
          return (
            <div key={r} className={s.drRow} data-lit={lit ? "" : undefined}>
              <button className={s.drName} aria-pressed={lit} onClick={() => m.setOpen(r)} title={`${shelfRowName(r)}: ${drumSoundName(m.sounds[r].preset)}`}>
                <span>{shelfRowName(r)}{doubtful && <span className={s.drOff}> off</span>}</span>
                {/* C2: one short reason under the label, not over the strip; else the row's sound (L278). */}
                {doubtful && !off && rr?.note ? <small className={s.drWhy}>{shortWhy(rr.note)}</small> : <small className={s.drSound}>{drumSoundName(m.sounds[r].preset)}</small>}
              </button>
              <div className={s.drTrack}>
                <Pattern hits={rr?.hits ?? []} bars={bars} lit={lit} doubtful={doubtful} empty={off} />
                {loop?.state === "memory" && !off && <TrackHead heardMs={heardMs} loop={loop} bars={bars} />}
              </div>
              <div className={s.drSlot}>
                {!off && rr?.doubtful
                  ? doubtful
                    ? <button className={s.textBtn} title={rr.why ?? undefined} onClick={() => m.playAnyway(r)}>Play anyway</button>
                    : <button className={s.textBtn} title="Leave this row out of Mine again, as the reading suggests" onClick={() => m.backToOff(r)}>Back to off</button>
                  : m.savedRows[r] && <span className={s.drSaved}>saved</span>}
              </div>
            </div>
          );
        })}
      </div>
      <Shelf m={m} row={row} playing={playing} off={off} rowOff={rowOff} />
      {wait ? <p className={s.drWait} role="status">{wait}</p> : (
        <div className={s.drSuggest}>
          <p className={s.suggest} aria-live="polite">{line}</p>
          {/* P6: local analysis by synthesis; it only moves the gold ticks. */}
          {/* U10: once the ticks are placed for these knobs it is a plain note, not a greyed button. */}
          {rowOff || (m.suggestedNow[row] && m.suggesting !== row)
            ? null
            : <button className={s.ghost} onClick={() => m.suggestNow(row)} disabled={!m.read?.targets[row] || m.suggesting !== null}
              title="Places gold ticks where the knobs come closest to the original, and names a starting sound that gets clearly closer; it never turns a knob">{m.suggesting === row ? "Suggesting…" : `Suggest for ${rowTitle(row)}`}</button>}
        </div>
      )}
    </div>
  );
}

const famLabel = (f: string) => (f === "909 ride" ? "909 ride (stand-ins)" : f.charAt(0).toUpperCase() + f.slice(1));

/**
 * Phase 7 (design p7-final, L278): the open row's sound and its 20 starting sounds. The head says
 * which sound plays (name, family · feel, one plain line) beside its knobs; under it the sounds in
 * their families, a feel word each; a tap plays one (in the loop, or alone when stopped). "Hide
 * sounds" folds the shelf to its head. The row's saved sounds from this track sit at the end.
 */
function Shelf({ m, row, playing, off, rowOff }: { m: DrumsModel; row: DrumRow; playing: boolean; off: boolean; rowOff: boolean }) {
  const short = useShort();
  const snd = m.sounds[row], ticks = m.ticks[row]?.macros, kit = p7SoundById(snd.preset);
  const kitRow = KIT_ROW_FOR[row], closerTip = m.ticks[row]?.closer ?? null;
  const score = (d: number) => Math.round(100 * Math.exp(-d / ROW_SCORE_SCALE));
  const mine = m.mySounds.filter((x) => rowOf(x.preset) === row);
  const knobSize = short === 2 ? 34 : short === 1 ? 54 : 60, tight = short === 2;
  return (
    <section className={s.shelf} aria-label={`${shelfRowName(row)} sounds`}>
      <div className={s.shelfHead}>
        {/* On a short window (≤ 760 px) the row is already lit above: its count goes, credits move right, and the plain line sits under the name. */}
        {!tight && (
          <div className={s.shelfWhere}>
            <span className={s.lbl}>{shelfRowName(row)} · 20 sounds</span>
            <SoundCredits />
          </div>
        )}
        <div className={s.shelfNow}>
          <span className={s.shelfName}>{drumSoundName(snd.preset)}</span>{" "}
          <span className={s.lbl}>{kit ? `${famLabel(kit.family)} · ${kit.feel}` : "Six AM's drum synth (from an earlier saved sound)"}</span>
          {closerTip && (
            <span className={s.shelfCloser} data-gap="" title={`About ${score(closerTip.distance)} against ${score(closerTip.own)} for this sound at its best`}>{drumSoundName(closerTip.preset)} is closer · <button className={s.textBtn} onClick={() => m.pick(row, closerTip.preset, playing)}>Try {drumSoundName(closerTip.preset)}</button></span>
          )}
        </div>
        <div className={s.drKnobs} data-off={off ? "" : undefined}>
          {knobsOf(snd.preset).map((id) => (
            <Knob key={`${row}-${snd.preset}-${id}`} id={id} spec={drumKnobSpec(snd.preset, id)} wordOf={(v) => drumKnobWord(snd.preset, id, v, m.bpm).split(" · ")[0]} detailOf={(v) => drumKnobDetail(snd.preset, id, v)} value={snd.macros[id] ?? 0} sug={off || rowOff ? undefined : ticks?.[id]}
              color="#f2b134" disabled={off} onChange={(v) => m.setKnob(row, id, v)} reset={clampDrumMacros(snd.preset, undefined)[id] ?? 0} size={knobSize} />
          ))}
        </div>
        <div className={s.shelfWhere} data-end="">
          <button className={s.textBtn} aria-expanded={m.shelf} onClick={() => m.setShelf(!m.shelf)}>{m.shelf ? "Hide sounds" : "Show 20 sounds"}</button>
          {tight && <SoundCredits />}
        </div>
      </div>
      {/* U7-2: the plain line has the shelf's full width, so it is never cut. */}
      <p className={s.shelfAbout}>{drumSoundAbout(snd.preset)}</p>
      {m.shelf && (
        <ShelfGroups compact={tight} label={`${shelfRowName(row)} sounds`} families={[
          ...P7_FAMILIES[kitRow].map((f) => ({
            label: famLabel(f),
            items: p7Sounds(kitRow).filter((x) => x.family === f).map((x) => ({ id: x.id, name: x.name, feel: x.feel, about: x.about, pressed: snd.preset === x.id, onPick: () => m.pick(row, x.id as DrumSoundId, playing) })),
          })),
          ...(mine.length ? [{ label: "Your sounds", items: mine.map((x) => ({ id: x.id, name: x.name, feel: drumSoundName(x.preset), mine: true, about: `${x.name}: ${drumSoundName(x.preset)}${isDrumPreset(x.preset) ? " (synth)" : ""}`, onPick: () => m.loadSound(x) })) }] : []),
        ]} />
      )}
    </section>
  );
}


/** A/B at the same loudness, the bass under both (P7), and the open row's closeness (P8, U1/L233: one number, the open row's). */
export function DrumsCheck({ m }: { m: DrumsModel }) {
  return (
    <div className={`${s.checkRow} ${s.drCheck}`}>
      <div className={s.abWrap}>
        <div className={s.ab} role="group" aria-label="Compare at the same loudness">
          <button aria-pressed={m.ab === "a"} onClick={() => m.setAb("a")}>A · Original drums</button>
          <button aria-pressed={m.ab === "b"} onClick={() => m.setAb("b")} disabled={!m.mineAny || m.allOff} title={m.allOff ? "Every row is off: press Play anyway on a row to hear Mine" : m.mineAny ? undefined : "Mine plays once the loop is read"}>B · Mine</button>
        </div>
        <span className={s.faint}>{m.allOff ? "every row is off" : "same loudness"}</span>
      </div>
      <button className={s.ghost} aria-pressed={m.bed} onClick={() => m.setBed(!m.bed)} title="Plays the original bass under both A and B, so you judge the drums in the groove">{m.bed ? "Bass under both: on" : "Bass under both: off"}</button>
      <span className={s.drScore} title="How close this row's hit measures to the original's (its sound across its own bands, the kick's note, the hats' width): it rises as you follow this row's gold ticks. Numbers only.">
        {/* N3: an off row isn't in Mine, so it has no score. */}
        closeness · {rowTitle(m.open)} <b>{m.read?.d.rows[m.open].doubtful && !m.anyway.includes(m.open) ? "–" : m.rowCloseness?.[m.open]?.score ?? "–"}</b> / 100
      </span>
    </div>
  );
}

/** Save the open row ("Save kick"); rows show "✓ saved". */
export function DrumsSaveBar({ m }: { m: DrumsModel }) {
  const row = m.open;
  const label = `Save ${drumNoun(m.sounds[row].preset)}`;
  return (
    <div className={s.saveBar}>
      <label className={s.saveLabel} htmlFor="save-name">Name</label>
      <input id="save-name" name="sound-name" autoComplete="off" spellCheck={false} className={s.input} value={m.name} maxLength={60} onChange={(e) => m.setName(e.target.value)} disabled={m.readState !== "ready"} />
      <span className={s.facts} title={m.tags.join(" · ")}>{m.tags.join(" · ")}</span>
      <span className={s.saved} role="status">{m.saved.state === "error" ? m.saved.text : m.saved.savedAs && m.saved.action === "none" ? `Saved as ${m.saved.savedAs}` : ""}</span>
      <button className={s.gold} onClick={() => void m.save()} disabled={!m.canSave}>{m.saved.state === "saving" ? "Saving…" : label}</button>
    </div>
  );
}
