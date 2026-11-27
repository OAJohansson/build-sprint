"use client";

// Make for drums (Phase 5 slice 1, P1, P3, P6–P10; design Fold, round 3 + round 4, L224–L226,
// T116–T124). Mine plays the rows together over the loop, in its timing (swing kept, L215), at the
// original's loudness; A/B against the original drum part, the original bass under both by default
// (P7). The drum part is read off the main thread from a copy that the worker zeroes (C2): only
// numbers come back. Save saves the open row ("Save kick") to My sounds.
// Phase 7 slice 1 (L266, L267, L272, L278, R1, R2): each row starts from 20 sampled sounds on a shelf
// under the rows (family groups; a tap plays it in the loop, or alone when the loop is stopped), the
// picked sound's name and plain line above, its four knobs (Pitch, Length, Tone, Drive) beside it, and
// the sound credits one click away. A saved synth sound still opens as it was.
// Phase 7 slice 2 (design p7-final ?m=2 / ?m=r; R3, R3b, R4, R5, L268, L272, L273b/c, L277, T233):
// six rows, Kick, Claps & snares, Closed hat, Open hat (read from the loop, "Six AM heard these"),
// then a dashed line and the rows to fill by ear (Shaker / percussion, Ride), which start empty and say
// so in plain words. Every 16th is a step to tap: a read hit (gold) taps out (gold outline), an empty
// step taps in (cream), a second tap undoes. Mute and Solo per row. What plays is what is saved. The
// bar ruler over the rows plays from the spot you click.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import type { LabTransport, LoopState } from "@/lib/lab/transport";
import { clampDrumMacros, drumKnobDetail, drumKnobSpec, drumKnobWord, drumMoves, drumSoundAbout, drumSoundName, drumSuggestLine, isDrumPreset, isKitId, knobsOf, makeRowOf, type DrumMacros, type DrumSoundId } from "@/lib/make/drum-synth";
import { EAR_ROWS, MAKE_ROWS, READ_OPEN_HATS, ROW_SCORE_SCALE, foldRow, rowCandidates, type DrumsCloseness, type DrumsReading, type DrumsReport, type MakeRow, type RowSound, type RowTarget } from "@/lib/make/drums-make";
import { NO_EDITS, editCount, heardRows, playedHits, stepKinds, toggleStep, type HitKind, type RowEdits } from "@/lib/make/drum-edit";
import { MakeClient } from "@/lib/make/make-client";
import { P7_FAMILIES, P7_ROW_NAMES, p7SoundById, p7Sounds } from "@/lib/make/kit-p7";
import { hasKitSample } from "@/lib/make/kit-samples";
import { loadSample, loadSamples, previewDrum } from "@/lib/make/kit-load";
import { drumNoun, isDrumSound, saveAction, soundId, suggestDrumName, suggestDrumTags, type DrumSound } from "@/lib/make/library";
import { secondsPer16th } from "@/lib/make/render";
import { ApiError, mentorApi } from "@/lib/mentor/client";
import { Knob } from "@/components/ui/knob";
import { SoundCredits } from "./sound-credits";
import { ShelfGroups } from "./shelf-groups";
import s from "./lab.module.css";

const loopKeyOf = (l: LoopState | null) => (l?.state === "memory" ? `${Math.round(l.startMs)}-${Math.round(l.endMs)}` : null);
type ReadState = "idle" | "reading" | "ready" | "nohits" | "error";
type Row = MakeRow;
type Read = { loopKey: string; d: DrumsReading; targets: Record<Row, RowTarget | null>; report: DrumsReport; levelDb: number; lufs: number; samples: number; rate: number };
type Sound = { preset: DrumSoundId; macros: DrumMacros };
/** Phase 7 (design, L278, T243): each row starts on a sampled sound that suits house. */
const HOME: Record<Row, DrumSoundId> = { kick: "kick-house-bounce", clap: "clap-909-clap", hat: "hat-909-closed", ohat: "ohat-909-open", perc: "perc-egg-shaker", ride: "ride-ride-22" };
const fresh = (p: DrumSoundId): Sound => ({ preset: p, macros: clampDrumMacros(p, undefined) });
const perRow = <T,>(f: (r: Row) => T) => Object.fromEntries(MAKE_ROWS.map((r) => [r, f(r)])) as Record<Row, T>;
/** The row's name, in the kit's words ("Closed hat", "Shaker / percussion"). */
const rowName = (r: Row) => P7_ROW_NAMES[r];
/** D7-6: the row in a sentence ("Suggest for closed hat"). */
const rowTitle = (r: Row) => rowName(r).toLowerCase();
/** R3b: what a row to fill by ear asks for, in plain words. */
const EAR_WORDS: Partial<Record<Row, { noun: string; listen: string; plural: string }>> = {
  ohat: { noun: "open hat", listen: "an open hat", plural: "open hats" },
  perc: { noun: "shaker", listen: "a shaker", plural: "shakers" },
  ride: { noun: "ride", listen: "a ride", plural: "rides" },
};
/** The recordings a set of sounds plays from (synth presets have none). */
const kitIdsOf = (xs: Sound[]) => xs.map((x) => x.preset).filter(isKitId);
/** Graders and Phase 5 hooks may still say "hats": that row is Closed hat now (R9). */
export const asMakeRow = (r: string): Row => (r === "hats" ? "hat" : (MAKE_ROWS as string[]).includes(r) ? (r as Row) : "kick");

/** How a row to fill by ear stands (R3b, L277): still open, left empty on purpose, or filled. */
export type EarState = "open" | "left" | "yours";

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

  const [open, setOpen] = useState<Row>("kick");
  const [sounds, setSounds] = useState<Record<Row, Sound>>(() => perRow((r) => fresh(HOME[r])));
  const [ticksS, setTicks] = useState<Record<Row, { for: string; macros: DrumMacros; moved: string | null; closer?: { preset: DrumSoundId; distance: number; own: number } | null } | null>>(() => perRow(() => null));
  const [suggesting, setSuggesting] = useState<Row | null>(null);
  const [readS, setReadS] = useState<Read | null>(null);
  const [state, setState] = useState<{ loopKey: string; state: ReadState; error?: string } | null>(null);
  const [anywayS, setAnyway] = useState<{ loopKey: string | null; rows: Row[] }>({ loopKey: null, rows: [] });
  const [ab, setAb] = useState<"a" | "b">("a");
  const [bed, setBed] = useState(true); // P7: the original bass under both A and B
  const [mineS, setMine] = useState<{ key: string; closeness: DrumsCloseness; rowCloseness: Record<Row, { score: number; distance: number } | null>; gainDb: number; rowGainsDb: Record<Row, number | null>; ms: number } | null>(null);
  const [names, setNames] = useState<Record<Row, string | null>>(() => perRow(() => null));
  const [last, setLast] = useState<Record<Row, { id: string; sound: string; name: string; steps: string } | null>>(() => perRow(() => null));
  const [saveState, setSaveState] = useState<{ state: "idle" | "saving" | "error"; text?: string }>({ state: "idle" });
  const [mySounds, setMySounds] = useState<DrumSound[]>([]);
  // Phase 7: bumped when recordings finish loading, so Mine renders again with them; and the last tap (W12, for the dev hook).
  const [samplesV, setSamplesV] = useState(0);
  const [tap, setTap] = useState<{ id: string; at: number; heardMs: number | null } | null>(null);
  const [shelf, setShelf] = useState(true);
  // Slice 2 (R4): the owner's edits per row, the rows left empty on purpose (L277), both per loop; mute and solo per row.
  const [editsS, setEdits] = useState<{ loopKey: string | null; rows: Record<Row, RowEdits> }>({ loopKey: null, rows: perRow(() => NO_EDITS) });
  const [leftS, setLeft] = useState<{ loopKey: string | null; rows: Row[] }>({ loopKey: null, rows: [] });
  const [mute, setMute] = useState<Record<Row, boolean>>(() => perRow(() => false));
  const [solo, setSolo] = useState<Record<Row, boolean>>(() => perRow(() => false));
  // L272: whether Open hat is read from the loop (the PM's flag; graders may switch it to compare).
  const [readOpen, setReadOpen] = useState(READ_OPEN_HATS);

  const read = readS && readS.loopKey === loopKey ? readS : null;
  const readState: ReadState = state && state.loopKey === loopKey ? state.state : "idle";
  const anyway = useMemo(() => (anywayS.loopKey === loopKey ? anywayS.rows : []), [anywayS, loopKey]);
  const edits = useMemo(() => (editsS.loopKey === loopKey ? editsS.rows : perRow(() => NO_EDITS)), [editsS, loopKey]);
  const left = useMemo(() => (leftS.loopKey === loopKey ? leftS.rows : []), [leftS, loopKey]);
  const sps = secondsPer16th(o.bpm);
  // What each row plays (and saves): read hits minus taken out, plus added (R4, W6).
  const played = useMemo(() => (read ? perRow((r) => playedHits(read.d.rows[r].hits, edits[r], { gridMs: read.d.gridMs, sps })) : null), [read, edits, sps]);
  const kinds = useMemo(() => (read ? perRow((r) => stepKinds(read.d.rows[r].hits, edits[r])) : null), [read, edits]);
  // A row Mine can play: it has hits and isn't off as doubtful (bleed, L225); then mute and solo choose what is heard.
  const on = useMemo(() => perRow((r) => !!read && !!played && played[r].length > 0 && (!read.d.rows[r].doubtful || anyway.includes(r))), [read, played, anyway]);
  const heard = useMemo(() => heardRows(MAKE_ROWS, mute, solo), [mute, solo]);
  const plays = useMemo(() => perRow((r) => on[r] && heard[r]), [on, heard]);
  // R3b, L268: the rows below the line (Shaker, Ride; Open hat too when it isn't read) and how each stands.
  const earRows: Row[] = useMemo(() => (read && read.d.openRead === false ? ["ohat", ...EAR_ROWS] : !read && !readOpen ? ["ohat", ...EAR_ROWS] : EAR_ROWS), [read, readOpen]);
  const earState = perRow((r): EarState | null => (!earRows.includes(r) ? null : played && played[r].length > 0 ? "yours" : left.includes(r) ? "left" : "open"));
  const openRows = earRows.filter((r) => earState[r] === "open");
  // A row whose recording hasn't loaded yet isn't in the signature as ready, so Mine renders again once it is.
  const signature = (x: Record<Row, Sound>) => MAKE_ROWS.map((r) => `${x[r].preset}:${knobsOf(x[r].preset).map((k) => (x[r].macros[k] ?? 0).toFixed(3)).join(",")}:${plays[r] ? 1 : 0}:${plays[r] && played ? played[r].map((h) => h.step).join(".") : ""}:${isKitId(x[r].preset) && !hasKitSample(x[r].preset) ? "wait" : "ok"}`).join("|");
  void samplesV; // a re-render after a load recomputes the signature
  const mineKeyNow = read ? `${read.loopKey}|${signature(sounds)}` : null;
  const mine = mineS && read && mineS.key.startsWith(`${read.loopKey}|`) ? mineS : null;

  const suggest = useCallback(async (r: Read, row: Row, snd: Sound, before: DrumMacros | null) => {
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
      // N2: another sound of the row that gets clearly closer at its best.
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
    const l = held.left.slice(), rt = held.right.slice();
    const samples = l.length, rate = held.rate;
    cl().drumsRead({ left: l, right: rt, rate, bpm: o.bpm, openHats: readOpen }).then(async (res) => {
      const n = MAKE_ROWS.map((r) => res.reading.rows[r].hits.length);
      console.info(`[make] drums read in ${res.ms} ms: ${MAKE_ROWS.map((r, i) => `${r} ${n[i]}`).join(", ")} hits, grid ${res.reading.gridMs} ms, swing ${res.reading.swingMs} ms`);
      if (!n.some((x) => x > 0)) { setState({ loopKey: key, state: "nohits" }); return; }
      const r: Read = { loopKey: key, d: res.reading, targets: res.targets, report: res.report, levelDb: res.levelDb, lufs: res.lufs, samples, rate };
      setReadS(r);
      setState({ loopKey: key, state: "ready" });
      // Gold ticks for every row with hits, one after another in the search worker.
      for (const row of MAKE_ROWS) if (r.targets[row]) await suggest(r, row, soundsRef.current[row], null);
    }, (e) => setState({ loopKey: key, state: "error", error: `Make couldn't read the drums: ${e instanceof Error ? e.message : String(e)}` }));
  }, [o.bpm, tr, suggest, readOpen]);
  useEffect(() => {
    if (!o.active || !loopKey || readFor === loopKey) return;
    const t = setTimeout(() => startRead(loopKey), 0);
    return () => clearTimeout(t);
  }, [o.active, loopKey, readFor, startRead]);

  // Mine: the rows rendered together on every change (debounced), swapped in, in sync.
  useEffect(() => {
    // Mine is one buffer for every family: render again when the bass's sound took it meanwhile.
    if (!o.active || !read || !played || !mineKeyNow || (mineKeyNow === mineS?.key && tr.current?.mineOwner === "drums")) return;
    // Phase 7: load a row's recording first (its first tap); Mine renders once it is in.
    const need = kitIdsOf(MAKE_ROWS.filter((r) => plays[r]).map((r) => sounds[r])).filter((id) => !hasKitSample(id));
    if (need.length) { void loadSamples(need).then(() => setSamplesV((v) => v + 1)); return; }
    const t = setTimeout(() => {
      const levels = perRow((r) => read.targets[r]?.levelDb ?? null);
      const rowSounds: Record<Row, RowSound> = perRow((r) => ({ ...sounds[r], on: plays[r] }));
      // R4: Mine plays the edited pattern (what Save keeps), the muted rows silent.
      const reading: DrumsReading = { ...read.d, rows: perRow((r) => ({ ...read.d.rows[r], hits: played[r] })) };
      cl().drumsRender({ reading, sounds: rowSounds, levels, report: read.report, bpm: o.bpm, rate: read.rate, samples: read.samples, levelDb: read.levelDb, lufs: read.lufs, targets: read.targets }, kitIdsOf(MAKE_ROWS.map((r) => sounds[r]))).then(({ res, stale }) => {
        if (stale || loopKeyOf(tr.current?.state.loop ?? null) !== read.loopKey) return;
        tr.current?.setMine(res, "drums");
        // W12: when the tapped sound first plays in Mine (ms after the tap), for the dev hook.
        setTap((x) => (x && x.heardMs === null && MAKE_ROWS.some((r) => sounds[r].preset === x.id) ? { ...x, heardMs: Math.round(performance.now() - x.at) } : x));
        setMine({ key: mineKeyNow, closeness: res.closeness, rowCloseness: res.rowCloseness, gainDb: res.gainDb, rowGainsDb: res.rowGainsDb, ms: res.ms });
      }, (e) => console.warn("[make] drums render failed", e));
    }, 60);
    return () => clearTimeout(t);
  }, [o.active, read, played, plays, mineKeyNow, mineS?.key, sounds, o.bpm, tr]);

  // Phase 7 (W12): the rows' current recordings load as soon as Drums opens, before the loop is read.
  useEffect(() => {
    if (!o.active) return;
    const need = kitIdsOf(MAKE_ROWS.map((r) => soundsRef.current[r])).filter((id) => !hasKitSample(id));
    if (need.length) void loadSamples(need).then(() => setSamplesV((v) => v + 1));
  }, [o.active]);

  // This track's drum sounds in the library (numbers only), for each row's shelf.
  useEffect(() => {
    if (!o.code || !o.url) return;
    let live = true;
    mentorApi(o.code).sounds({ source: o.url, part: "drums" }).then((xs) => { if (live) setMySounds(xs.filter(isDrumSound) as DrumSound[]); }, () => { /* the shelf just has none */ });
    return () => { live = false; };
  }, [o.code, o.url]);

  const setPreset = (row: Row, p: DrumSoundId) => {
    const next = fresh(p);
    setSounds((x) => ({ ...x, [row]: next }));
    setTicks((t) => ({ ...t, [row]: null }));
    if (read) void suggest(read, row, next, null);
  };
  const setKnob = (row: Row, id: keyof DrumMacros, v: number) => setSounds((x) => (x[row].macros[id] === v ? x : { ...x, [row]: { ...x[row], macros: { ...x[row].macros, [id]: v } } }));
  /**
   * A tap on the shelf (Phase 7): the row plays this sound, in the loop (B · Mine) when it plays, or
   * one hit on its own when it's stopped; its recording loads on the first tap.
   */
  const pick = (row: Row, id: DrumSoundId, playing: boolean) => {
    setTap({ id, at: performance.now(), heardMs: null });
    if (sounds[row].preset !== id) setPreset(row, id);
    if (playing && read) { setAb("b"); void loadSample(id).then(() => setSamplesV((v) => v + 1)); }
    else void previewDrum(id, clampDrumMacros(id, undefined)).then(() => setTap((x) => (x && x.id === id && x.heardMs === null ? { ...x, heardMs: Math.round(performance.now() - x.at) } : x)));
  };
  /** R9: a saved sound opens on its row; an old 3-row sound's Hats on Closed hat. */
  const loadSound = (x: DrumSound) => {
    const row = makeRowOf(x.preset);
    const snd = { preset: x.preset, macros: clampDrumMacros(x.preset, x.macros) };
    setSounds((s0) => ({ ...s0, [row]: snd }));
    setNames((n) => ({ ...n, [row]: x.name }));
    setLast((l) => ({ ...l, [row]: { id: x.id, sound: soundId(snd.preset, snd.macros), name: x.name, steps: played ? played[row].map((h) => h.step).join(".") : "" } }));
    setTicks((t) => ({ ...t, [row]: null }));
    setOpen(row);
    if (read) void suggest(read, row, snd, null);
  };
  const playAnyway = (row: Row) => setAnyway({ loopKey, rows: [...anyway.filter((r) => r !== row), row] });
  // U3: "Play anyway" is undone with "Back to off" (the reading's call again).
  const backToOff = (row: Row) => setAnyway({ loopKey, rows: anyway.filter((r) => r !== row) });

  /** R4: one tap on a step of a row (read hit out / back, empty step in / out). Opens the row too. */
  const tapStep = (row: Row, step: number) => {
    if (!read) return;
    setEdits((e) => {
      const cur = e.loopKey === loopKey ? e.rows : perRow(() => NO_EDITS);
      return { loopKey, rows: { ...cur, [row]: toggleStep(cur[row], read.d.rows[row].hits, step, read.d.steps) } };
    });
    // A row you tap a hit into is no longer "left empty".
    if (left.includes(row)) setLeft({ loopKey, rows: left.filter((r) => r !== row) });
    setOpen(row);
    // Hearing an edit needs Mine.
    setAb("b");
  };
  const leaveEmpty = (row: Row, on: boolean) => setLeft({ loopKey, rows: on ? [...left.filter((r) => r !== row), row] : left.filter((r) => r !== row) });
  const toggleMute = (row: Row) => setMute((x) => ({ ...x, [row]: !x[row] }));
  const toggleSolo = (row: Row) => setSolo((x) => ({ ...x, [row]: !x[row] }));

  // Save the open row (P9): its sound, and exactly the hits it plays, folded to their shortest exact repeat (W6).
  const scale = o.scale === "major" || o.scale === "minor" ? o.scale : null;
  const cur = sounds[open];
  const sid = soundId(cur.preset, cur.macros);
  const stepsKey = (r: Row) => (played ? played[r].map((h) => h.step).join(".") : "");
  const suggested = suggestDrumName(cur.preset, cur.macros, o.title);
  const lastRow = last[open];
  const nameRaw = names[open];
  const nameField = nameRaw === null || (lastRow && lastRow.sound !== sid && nameRaw === lastRow.name) ? suggested : nameRaw;
  const nameNow = nameField.trim() || suggested;
  // An edited pattern is a new sound to save, even with the same knobs.
  const sameSaved = (r: Row) => !!last[r] && last[r]!.sound === soundId(sounds[r].preset, sounds[r].macros) && last[r]!.steps === stepsKey(r);
  const action = saveAction({ sound: sid, name: nameNow }, lastRow && lastRow.steps === stepsKey(open) ? lastRow : null);
  const tags = suggestDrumTags(cur.preset, o.bpm, o.title, cur.macros);
  const savedRows = perRow((r) => sameSaved(r));
  const canSave = readState === "ready" && on[open] && saveState.state !== "saving" && action.kind !== "none";
  const save = async (row: Row = open, nameOverride?: string) => {
    if (!read || !scale || !o.keyName || !played) return;
    const snd = sounds[row], id = soundId(snd.preset, snd.macros);
    const lr = last[row] && last[row]!.steps === stepsKey(row) ? last[row] : null;
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
          pattern: foldRow(row, played[row], read.d.steps),
          key: o.keyName, scale, bpm: o.bpm, source: { title: o.title, url: o.url }, tags: suggestDrumTags(snd.preset, o.bpm, o.title, snd.macros),
        });
      setLast((l) => ({ ...l, [row]: { id: res.id, sound: id, name: res.name, steps: stepsKey(row) } }));
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
    suggestNow: (row: Row) => { if (read) void suggest(read, row, sounds[row], ticks[row]?.macros ?? null); },
    suggestedNow: perRow((r) => !!ticks[r] && ticks[r]!.for === soundId(sounds[r].preset, sounds[r].macros)),
    ab, setAb, bed, setBed, mineReady: !!mine && mine.key === mineKeyNow, mineAny: !!mine, closeness: mine?.closeness ?? null, rowCloseness: mine?.rowCloseness ?? null,
    /** M-F3: no row is heard in Mine (every row off, muted or left out by solo): B would play silence. */
    allOff: !!read && !MAKE_ROWS.some((r) => plays[r]),
    mySounds, loadSound, name: nameField, setName: (v: string) => setNames((n) => ({ ...n, [open]: v })), tags, save, canSave, savedRows,
    saved: { state: saveState.state, text: saveState.text, savedAs: lastRow && sameSaved(open) ? lastRow.name : null, action: action.kind },
    bpm: o.bpm,
    // Slice 2: the step grid, the rows to fill by ear, mute and solo.
    kinds, played, tapStep, earRows, earState, openRows, leaveEmpty, mute, solo, heard, toggleMute, toggleSolo,
    /** What the Lab Mentor gets with a question asked in Drums: the open row (numbers and ids; words on the server). */
    labRow: { family: "drums" as const, preset: sounds[open].preset, knobs: sounds[open].macros as Record<string, number>, ticks: (ticks[open]?.macros ?? null) as Record<string, number> | null, off: !!read?.d.rows[open].doubtful && !anyway.includes(open), note: read?.d.rows[open].why ?? null },
    /** Graders (Phase 5, Phase 7 slice 2): what Make's drums hold now, numbers only. */
    debug: () => ({
      readState, open, ab, bed, on, anyway, steps: read?.d.steps ?? null, gridMs: read?.d.gridMs ?? null, swingMs: read?.d.swingMs ?? null,
      rows: read && played && kinds ? perRow((r) => ({
        /** What the row plays and saves (read hits not taken out, plus added). */
        hits: played[r].map((h) => ({ step: h.step, off: h.off, vel: h.vel, t: h.t, kind: (kinds[r].get(h.step) ?? "added") as HitKind })),
        /** Every marked step: read, added, or a read hit taken out. */
        marks: [...kinds[r].entries()].sort((a, b) => a[0] - b[0]).map(([step, kind]) => ({ step, kind })),
        edits: editCount(edits[r]), doubtful: read.d.rows[r].doubtful, why: read.d.rows[r].why,
        mute: mute[r], solo: solo[r], heard: plays[r], ear: earState[r],
      })) : null,
      /** R3b: the rows still to fill by ear, as the line under the heard rows counts them. */
      openRows, earRows,
      /** L268, W5: whether Open hat was read, and each hat hit's open-vs-closed measure (t in s from the loop's start). */
      openHatsRead: read?.d.openRead ?? readOpen, hats: read?.d.hats ?? null,
      targets: read?.targets ?? null, levelDb: read?.levelDb ?? null, lufs: read?.lufs ?? null,
      sounds, ticks: perRow((r) => ticks[r]?.macros ?? null), closer: perRow((r) => ticks[r]?.closer ?? null),
      mine: mine ? { ready: mine.key === mineKeyNow, gainDb: mine.gainDb, rowGainsDb: mine.rowGainsDb, closeness: mine.closeness, rowCloseness: mine.rowCloseness, renderMs: mine.ms } : null,
      saved: perRow((r) => last[r]), mySounds: mySounds.map((x) => ({ id: x.id, name: x.name, preset: x.preset })),
      /** W6: the pattern Save would keep for each row now (its repeat and notes). */
      wouldSave: read && played ? perRow((r) => foldRow(r, played[r], read.d.steps)) : null,
      // Phase 7: the picked sound per row with its family and feel, and the last tap's time to sound (W12).
      picked: perRow((r) => ({ id: sounds[r].preset, name: drumSoundName(sounds[r].preset), family: p7SoundById(sounds[r].preset)?.family ?? "synth", feel: p7SoundById(sounds[r].preset)?.feel ?? null, loaded: !isKitId(sounds[r].preset) || hasKitSample(sounds[r].preset), macros: sounds[r].macros })),
      tap,
    }),
    /** Graders: read the loop again with Open hat read or not (L272's flag), as the PM would flip it. */
    setReadOpen: (v: boolean) => { setReadOpen(v); setState(null); },
  };
}
export type DrumsModel = ReturnType<typeof useDrums>;

// ── The middle ──────────────────────────────────────────────────────────────────────────────────

/** D-P1, D-R2: a short window gets smaller knobs: ≤ 860 px tall 72 px, ≤ 760 px 64 px (lab.module.css tiers). */
const SHORT = "(max-height: 860px)", SHORTER = "(max-height: 760px)";
const onShort = (cb: () => void) => {
  const ms = [matchMedia(SHORT), matchMedia(SHORTER)];
  ms.forEach((m) => m.addEventListener("change", cb));
  return () => ms.forEach((m) => m.removeEventListener("change", cb));
};
export const useShort = () => useSyncExternalStore(onShort, () => (matchMedia(SHORTER).matches ? 2 : matchMedia(SHORT).matches ? 1 : 0), () => 0);

const W = 1000; // the FX / melody strips' drawing units across (scaled to the column)
/** "Mentor:" lines start with a capital, whatever follows (C7). */
export const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** The playhead over the FX and melody rows: where the loop is now, across bar blocks with their gaps (one line of bars). */
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

/**
 * R5 (OR6-5): the FX and melody bar ruler, clickable: a click anywhere on it plays the loop from that
 * spot (bar blocks with gaps, as Playhead draws them); each bar number is also a button for the keyboard.
 */
export function JumpBars({ loop, bars, from, every = 1, onJump }: { loop: LoopState | null; bars: number; from: number | null; every?: number; onJump: (ms: number) => void }) {
  const gap = bars > 8 ? 4 : 8, bw = (W - gap * (bars - 1)) / bars;
  const len = loop ? loop.endMs - loop.startMs : 0;
  const at = (f: number) => { if (loop) onJump(loop.startMs + Math.max(0, Math.min(0.9999, f)) * len); };
  const click = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
    const b = Math.max(0, Math.min(bars - 1, Math.floor(x / (bw + gap))));
    at((b + Math.max(0, Math.min(1, (x - b * (bw + gap)) / bw))) / bars);
  };
  return (
    <div className={`${s.drBars} ${s.jumpBars}`} onClick={loop ? click : undefined} title={loop ? "Click a spot to play from there" : undefined}>
      {from !== null && Array.from({ length: bars }, (_, b) => b).filter((b) => b % every === 0).map((b) => (
        <button key={b} type="button" disabled={!loop} style={{ left: `${((b * (bw + gap)) / W) * 100}%` }} onClick={() => at(b / bars)} aria-label={`Play from bar ${from + b}`}>{from + b}</button>
      ))}
    </div>
  );
}

/** Until the knobs are live: what's happening and how long, said once. */
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

/** Bars per line of steps: a 16-bar loop draws as two lines of 8, so every step stays tappable (C1). */
const perLineOf = (bars: number) => (bars > 8 ? 8 : bars);

/**
 * The playhead in a row of steps (or the ruler), on the step the loop is at: the grid's step 0 sits
 * `gridMs` after the loop's start, as the reader placed it. Lines of bars stack (a 16-bar loop).
 */
function StepHead({ heardMs, loop, steps, gridMs, bpm, bars }: { heardMs: () => number; loop: LoopState; steps: number; gridMs: number; bpm: number; bars: number }) {
  const el = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    let raf = 0;
    const per = perLineOf(bars), lines = Math.ceil(bars / per), spsMs = 60000 / bpm / 4;
    const G = per > 4 ? 4 : 6;
    const tick = () => {
      const e = el.current, h = heardMs();
      if (e) {
        const inside = h >= loop.startMs && h < loop.endMs;
        e.style.display = inside ? "" : "none";
        if (inside) {
          const pos = ((((h - loop.startMs - gridMs) / spsMs) % steps) + steps) % steps, b = Math.floor(pos / 16), line = Math.floor(b / per), c = b % per, f = (pos - b * 16) / 16;
          e.style.left = `calc(${c} * (100% - ${G * (per - 1)}px) / ${per} + ${c * G}px + ${f} * (100% - ${G * (per - 1)}px) / ${per})`;
          e.style.top = `${(line / lines) * 100}%`;
          e.style.height = `${100 / lines}%`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heardMs, loop.startMs, loop.endMs, steps, gridMs, bpm, bars]);
  return <i ref={el} className={s.stHead} aria-hidden />;
}

const KIND_WORDS: Record<HitKind, string> = { read: "Six AM heard a hit", added: "your hit", removed: "a heard hit you took out" };

/** One row's steps: a cell per 16th, bars in blocks; a tap adds or takes out a hit (R4). */
function Steps({ row, steps, bars, from, kinds, muted, disabled, onTap, children }: { row: Row; steps: number; bars: number; from: number; kinds: Map<number, HitKind> | null; muted: boolean; disabled: boolean; onTap: (step: number) => void; children?: React.ReactNode }) {
  const per = perLineOf(bars), lines = Math.ceil(bars / per);
  return (
    <div className={s.steps} data-muted={muted ? "" : undefined} data-dense={per > 4 ? "" : undefined} style={{ gridTemplateRows: `repeat(${lines}, minmax(0, 1fr))` }}>
      {Array.from({ length: lines }, (_, L) => (
        <div key={L} className={s.stLine} style={{ gridTemplateColumns: `repeat(${per}, minmax(0, 1fr))` }}>
          {Array.from({ length: per }, (_, c) => {
            const b = L * per + c;
            if (b >= bars) return <span key={c} />;
            return (
              <div key={c} className={s.stBar}>
                {Array.from({ length: 16 }, (_, k) => {
                  const i = b * 16 + k;
                  if (i >= steps) return <span key={k} />;
                  const v = kinds?.get(i);
                  return <button key={k} type="button" className={s.st} data-k={v} data-beat={k % 4 === 0 ? "" : undefined} disabled={disabled} aria-pressed={v === "read" || v === "added"}
                    aria-label={`${rowName(row)}, bar ${from + b}, step ${k + 1}: ${v ? KIND_WORDS[v] : "empty"}`} onClick={() => onTap(i)} />;
                })}
              </div>
            );
          })}
        </div>
      ))}
      {children}
    </div>
  );
}

/** R5: the loop's bars over the rows; a click on any 16th plays from there (each is a button). A 16-bar loop gets two lines, as its rows do. */
function Ruler({ steps, bars, from, onJump, disabled, children }: { steps: number; bars: number; from: number; onJump: (step: number) => void; disabled: boolean; children?: React.ReactNode }) {
  const per = perLineOf(bars), lines = Math.ceil(bars / per);
  return (
    <div className={s.drRuler} data-dense={per > 4 ? "" : undefined} data-lines={lines} title={disabled ? undefined : "Click a spot to play from there"}>
      {Array.from({ length: lines }, (_, L) => (
        <div key={L} className={s.rLine} style={{ gridTemplateColumns: `repeat(${per}, minmax(0, 1fr))` }}>
          {Array.from({ length: per }, (_, c) => {
            const b = L * per + c;
            return (
              <div key={c} className={s.rb}>
                {b < bars && Array.from({ length: 16 }, (_, k) => {
                  const i = b * 16 + k;
                  if (i >= steps) return <span key={k} />;
                  return <button key={k} type="button" disabled={disabled} onClick={() => onJump(i)} aria-label={`Play from bar ${from + b}${k ? `, step ${k + 1}` : ""}`}>{k ? "" : from + b}</button>;
                })}
              </div>
            );
          })}
        </div>
      ))}
      {children}
    </div>
  );
}

/** The hit legend on the tab line (T239): read gold, added cream, taken out gold outline (T233). */
export function DrumsLegend() {
  return (
    <span className={s.legend} aria-label="What the hits mean">
      <span><i data-k="read" />Six AM heard</span><span><i data-k="added" />you added</span><span><i data-k="removed" />you took out</span>
    </span>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** R3b, L273b: why the rows below the line start empty, in the words of the rows still open. */
function whyEmpty(open: Row[], left: Row[]): string {
  if (!open.length) return left.length ? `Yours, by ear; ${left.map((r) => rowName(r)).join(" and ")} left empty on purpose.` : "Yours, by ear.";
  const names = open.map((r) => EAR_WORDS[r]!.plural).join(" or ");
  const rows = open.length === 1 ? `so ${rowName(open[0])} starts empty` : "so these rows start empty";
  return `Six AM can’t hear ${names} yet, ${rows} and the loop sounds thinner than the original. Some may be on Closed hat.`;
}

export function DrumsMiddle({ m, loop, from, playing, heardMs, onJump }: { m: DrumsModel; loop: LoopState | null; from: number | null; playing: boolean; heardMs: () => number; onJump: (ms: number) => void }) {
  const steps = m.read?.d.steps ?? (loop ? Math.max(16, Math.round((loop.endMs - loop.startMs) / (60000 / m.bpm / 4))) : 64);
  const bars = Math.max(1, Math.round(steps / 16));
  const wait = waitLine(m, loop, playing);
  const off = !!wait;
  const row = m.open, snd = m.sounds[row], ticks = m.ticks[row]?.macros;
  const noun = drumNoun(snd.preset);
  const fromBar = from ?? 1;
  const live = loop?.state === "memory" && !off;
  const gridMs = m.read?.d.gridMs ?? 0, spsMs = 60000 / m.bpm / 4;
  // R5: a step's start in the track (the grid's step 0 sits gridMs after the loop's start), kept inside the loop.
  const jumpTo = (step: number) => { if (loop) onJump(Math.max(loop.startMs, Math.min(loop.endMs - 1, loop.startMs + gridMs + step * spsMs))); };
  let line: React.ReactNode;
  const rowRead = m.read?.d.rows[row], rowOff = !!rowRead?.doubtful && !m.anyway.includes(row);
  const ear = m.earState[row];
  // U4: a row that is off gets the reason, not knob tips.
  if (rowOff) line = `Mentor: ${cap((rowRead?.why ?? "").replace(/: off in Mine$/, ""))}, so Mine leaves this row out.`;
  else if (m.suggesting === row) line = `Measuring the ${noun} against the row's 20 sounds…`;
  else if (!m.read?.targets[row]) line = <span className={s.faintLine}>{ear ? `Nothing to compare with here: pick a ${EAR_WORDS[row]?.noun ?? noun} by ear, then tap its hits in.` : `No ${rowTitle(row)} hits in this loop to compare with.`}</span>;
  else if (!ticks) line = `Mentor: Press Suggest for ${rowTitle(row)} to compare this sound with the original.`;
  else {
    const closer = m.ticks[row]?.closer;
    line = <>Mentor: {cap(drumSuggestLine(snd.preset, snd.macros, ticks, noun, m.bpm))}
      {/* U7-5: a clearly closer sound is offered on the shelf, under the sound's name (Shelf). */}
      {!closer && m.ticks[row]?.moved && drumMoves(knobsOf(snd.preset), snd.macros, ticks).length > 0 ? <><br /><span className={s.faintLine}>{m.ticks[row]!.moved}</span></> : null}</>;
  }
  const heardRowsList = MAKE_ROWS.filter((r) => !m.earRows.includes(r));
  const anySolo = MAKE_ROWS.some((r) => m.solo[r]);
  const rowView = (r: Row) => {
    const rr = m.read?.d.rows[r], lit = r === row, doubtful = !!rr?.doubtful && !m.anyway.includes(r), st = m.earState[r];
    const quiet = m.mute[r] || (anySolo && !m.solo[r]);
    const under = off ? null
      : st === "open" ? <div className={s.under} data-yours=""><span>Your turn: listen for {EAR_WORDS[r]!.listen} and tap it in</span> · <button type="button" className={s.textBtn} onClick={() => m.leaveEmpty(r, true)}>Leave empty</button></div>
      : st === "left" ? <div className={s.under}><span>Left empty, so the loop has no {EAR_WORDS[r]!.noun}</span> · <button type="button" className={s.textBtn} onClick={() => m.leaveEmpty(r, false)}>Undo</button></div>
      : rr?.doubtful ? <div className={s.under}>{doubtful
        ? <><span>{rr.note ?? "Probably bleed"}: off in Mine</span> · <button type="button" className={s.textBtn} title={rr.why ?? undefined} onClick={() => m.playAnyway(r)}>Play anyway</button></>
        : <><span>Playing a row Six AM doubted</span> · <button type="button" className={s.textBtn} title="Leave this row out of Mine again, as the reading suggests" onClick={() => m.backToOff(r)}>Back to off</button></>}</div>
      : null;
    return [
      <button key={`${r}-n`} type="button" className={s.rname} aria-pressed={lit} onClick={() => m.setOpen(r)} title={`${rowName(r)}: ${drumSoundName(m.sounds[r].preset)}`}>
        <span>{rowName(r)}{doubtful && <span className={s.drOff}> off</span>}{m.savedRows[r] && <span className={s.drSaved}> saved</span>}</span>
        <small>{drumSoundName(m.sounds[r].preset)}</small>
      </button>,
      <div key={`${r}-s`} className={s.stCell} data-open={st === "open" && !off ? "" : undefined}>
        <Steps row={r} steps={steps} bars={bars} from={fromBar} kinds={off ? null : m.kinds?.[r] ?? null} muted={quiet || doubtful} disabled={off || !m.read} onTap={(i) => m.tapStep(r, i)}>
          {live && loop && <StepHead heardMs={heardMs} loop={loop} steps={steps} gridMs={gridMs} bpm={m.bpm} bars={bars} />}
        </Steps>
      </div>,
      <span key={`${r}-m`} className={s.ms}>
        <button type="button" className={s.mbtn} aria-pressed={m.mute[r]} onClick={() => m.toggleMute(r)} aria-label={`Mute ${rowName(r)}`} title="Mute this row (the hits stay; Save keeps them)">Mute</button>
        <button type="button" className={s.mbtn} aria-pressed={m.solo[r]} onClick={() => m.toggleSolo(r)} aria-label={`Solo ${rowName(r)}`} title="Hear only this row (and other soloed rows)">Solo</button>
      </span>,
      under ? <div key={`${r}-u`} className={s.underCell}>{under}</div> : null,
    ];
  };
  const o = m.openRows;
  return (
    <div className={s.drums}>
      <div className={s.dr2} data-fill={m.shelf ? undefined : ""} role="group" aria-label="Drum rows">
        <span className={s.lbl} data-head="">Six AM heard these</span>
        <Ruler steps={steps} bars={bars} from={fromBar} onJump={jumpTo} disabled={!loop || off}>
          {live && loop && <StepHead heardMs={heardMs} loop={loop} steps={steps} gridMs={gridMs} bpm={m.bpm} bars={bars} />}
        </Ruler>
        <span />
        {heardRowsList.flatMap(rowView)}
        <div className={s.divide} data-done={o.length ? undefined : ""} role="status">
          {/* T238, L277: the count reads "0 rows to fill" once every row is filled or left empty on purpose. */}
          <span className={s.count} data-done={o.length ? undefined : ""}>{plural(o.length, "row", "rows")} to fill by ear</span>
          <span className={s.lbl}>{whyEmpty(o, m.earRows.filter((r) => m.earState[r] === "left"))}</span>
        </div>
        {m.earRows.flatMap(rowView)}
      </div>
      <Shelf m={m} row={row} playing={playing} off={off} rowOff={rowOff} />
      {wait ? <p className={s.drWait} role="status">{wait}</p> : (
        <div className={s.drSuggest}>
          <p className={s.suggest} aria-live="polite">{line}</p>
          {/* P6: local analysis by synthesis; it only moves the gold ticks. */}
          {/* U10: once the ticks are placed for these knobs it is a plain note, not a greyed button. */}
          {rowOff || !m.read?.targets[row] || (m.suggestedNow[row] && m.suggesting !== row)
            ? null
            : <button className={s.ghost} onClick={() => m.suggestNow(row)} disabled={m.suggesting !== null}
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
 * their families (names only; the feel word in each tooltip); a tap plays one (in the loop, or alone
 * when stopped). "Hide sounds" folds the shelf to its head. The row's saved sounds from this track
 * sit at the end.
 */
function Shelf({ m, row, playing, off, rowOff }: { m: DrumsModel; row: Row; playing: boolean; off: boolean; rowOff: boolean }) {
  const short = useShort();
  const snd = m.sounds[row], ticks = m.ticks[row]?.macros, kit = p7SoundById(snd.preset);
  const closerTip = m.ticks[row]?.closer ?? null;
  const score = (d: number) => Math.round(100 * Math.exp(-d / ROW_SCORE_SCALE));
  const mine = m.mySounds.filter((x) => makeRowOf(x.preset) === row);
  const knobSize = short === 2 ? 34 : short === 1 ? 46 : 52, tight = short === 2;
  return (
    <section className={s.shelf} aria-label={`${rowName(row)} sounds`}>
      <div className={s.shelfHead}>
        {/* On a short window (≤ 760 px) the row is already lit above: its count goes, credits move right, and the plain line sits under the name. */}
        {!tight && (
          <div className={s.shelfWhere}>
            <span className={s.lbl}>{rowName(row)} · 20 sounds</span>
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
          <button className={m.shelf ? s.textBtn : s.ghost} aria-expanded={m.shelf} onClick={() => m.setShelf(!m.shelf)}>{m.shelf ? "Hide sounds" : "Show 20 sounds"}</button>
          {tight && <SoundCredits />}
        </div>
      </div>
      {/* U7-2: the plain line has the shelf's full width, so it is never cut. */}
      <p className={s.shelfAbout}>{drumSoundAbout(snd.preset)}</p>
      {m.shelf && (
        // Critic (slice 1 round): names only on the shelf at every size; the feel word is in each tooltip and in the head for the picked sound.
        <ShelfGroups compact label={`${rowName(row)} sounds`} families={[
          ...P7_FAMILIES[row].map((f) => ({
            label: famLabel(f),
            items: p7Sounds(row).filter((x) => x.family === f).map((x) => ({ id: x.id, name: x.name, feel: x.feel, about: x.about, pressed: snd.preset === x.id, onPick: () => m.pick(row, x.id as DrumSoundId, playing) })),
          })),
          ...(mine.length ? [{ label: "Your sounds", items: mine.map((x) => ({ id: x.id, name: x.name, feel: drumSoundName(x.preset), mine: true, about: `${x.name}: ${drumSoundName(x.preset)}${isDrumPreset(x.preset) ? " (synth)" : ""}`, onPick: () => m.loadSound(x) })) }] : []),
        ]} />
      )}
    </section>
  );
}

/** A/B at the same loudness, the bass under both (P7), and the open row's closeness (P8, U1/L233: one number, the open row's). */
export function DrumsCheck({ m }: { m: DrumsModel }) {
  const allMuted = m.allOff && MAKE_ROWS.some((r) => m.on[r]);
  return (
    <div className={`${s.checkRow} ${s.drCheck}`}>
      <div className={s.abWrap}>
        <div className={s.ab} role="group" aria-label="Compare at the same loudness">
          <button aria-pressed={m.ab === "a"} onClick={() => m.setAb("a")}>A · Original drums</button>
          <button aria-pressed={m.ab === "b"} onClick={() => m.setAb("b")} disabled={!m.mineAny || m.allOff} title={allMuted ? "Every row is muted: unmute a row to hear Mine" : m.allOff ? "Every row is off: press Play anyway on a row to hear Mine" : m.mineAny ? undefined : "Mine plays once the loop is read"}>B · Mine</button>
        </div>
        <span className={s.faint}>{allMuted ? "every row is muted" : m.allOff ? "every row is off" : "same loudness"}</span>
      </div>
      <button className={s.ghost} aria-pressed={m.bed} onClick={() => m.setBed(!m.bed)} title="Plays the original bass under both A and B, so you judge the drums in the groove">{m.bed ? "Bass under both: on" : "Bass under both: off"}</button>
      <span className={s.drScore} title="How close this row's hit measures to the original's (its sound across its own bands, the kick's note, the hats' width): it rises as you follow this row's gold ticks. Numbers only.">
        {/* N3: an off row isn't in Mine, so it has no score; a row filled by ear has nothing to compare with. */}
        closeness · {rowTitle(m.open)} <b>{m.read?.d.rows[m.open].doubtful && !m.anyway.includes(m.open) ? "–" : m.rowCloseness?.[m.open]?.score ?? "–"}</b> / 100
      </span>
    </div>
  );
}

/** Save the open row ("Save kick"); rows show "saved". */
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
