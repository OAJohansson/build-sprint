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
import { clampDrumMacros, drumKnobDetail, drumKnobShown, drumKnobSpec, drumMoves, drumSoundAbout, drumSoundName, drumSuggestLine, isDrumPreset, isKitId, knobsOf, makeRowOf, type DrumMacros, type DrumSoundId } from "@/lib/make/drum-synth";
import { EAR_ROWS, MAKE_ROWS, READ_OPEN_HATS, ROW_SCORE_SCALE, foldRow, rowCandidates, type DrumsCloseness, type DrumsReading, type DrumsReport, type MakeRow, type RowSound, type RowTarget } from "@/lib/make/drums-make";
import { NO_EDITS, copyBar, editCount, editsFor, heardRows, playedHits, savedOnLoop, stepKinds, toggleStep, unfoldSteps, type HitKind, type RowEdits } from "@/lib/make/drum-edit";
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
const EAR_WORDS: Record<Row, { noun: string; listen: string; plural: string }> = {
  // U7-12: a read row Six AM heard nothing on is filled by ear too.
  kick: { noun: "kick", listen: "a kick", plural: "kicks" },
  clap: { noun: "clap or snare", listen: "a clap or snare", plural: "claps" },
  hat: { noun: "closed hat", listen: "a closed hat", plural: "closed hats" },
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

/** Stable empties (the same object every render, so memos keyed on them hold). */
const NO_ROWS: Row[] = [];
const NO_ROW_EDITS: Record<Row, RowEdits> = perRow(() => NO_EDITS);

/** L288: where a loop's fixes by ear are kept in this browser (steps only, no audio, C2). */
const editsKey = (url: string, loopKey: string) => `sixam.drums.edits.v1|${url}|${loopKey}`;
/** U7-19: the owner's own taps per row (added, taken out), so a hit that is new in a re-read shows as heard. `played` is the v1 shape, still read. */
type StoredEdits = { edits?: Partial<Record<Row, RowEdits>>; played?: Partial<Record<Row, number[]>>; left: Row[]; mute: Row[] };
function loadEdits(url: string, loopKey: string): StoredEdits | null {
  try { const v = JSON.parse(localStorage.getItem(editsKey(url, loopKey)) ?? "null"); return v && typeof v === "object" && (v.edits || v.played) ? v as StoredEdits : null; } catch { return null; }
}
function storeEdits(url: string, loopKey: string, v: StoredEdits | null) {
  try { if (v) localStorage.setItem(editsKey(url, loopKey), JSON.stringify(v)); else localStorage.removeItem(editsKey(url, loopKey)); } catch { /* private mode or full: the fixes just aren't kept */ }
}

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
  // D7-11: each save remembers the loop it was made on; on another loop the row has no last save.
  const [lastS, setLast] = useState<Record<Row, { id: string; sound: string; name: string; steps: string; loopKey: string | null } | null>>(() => perRow(() => null));
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
  const last = perRow((r) => savedOnLoop(lastS[r], loopKey));
  // L289: the 4 bars shown while fixing; null follows the playhead. U7-14: the bar last tapped per row.
  const [pageS, setPage] = useState<{ loopKey: string | null; page: number | null }>({ loopKey: null, page: null });
  const pinnedPage = pageS.loopKey === loopKey ? pageS.page : null;
  const [tapBar, setTapBar] = useState<Partial<Record<Row, number>>>({});
  const [restored, setRestored] = useState<string | null>(null);
  const readState: ReadState = state && state.loopKey === loopKey ? state.state : "idle";
  const anyway = anywayS.loopKey === loopKey ? anywayS.rows : NO_ROWS;
  const edits = editsS.loopKey === loopKey ? editsS.rows : NO_ROW_EDITS;
  const left = leftS.loopKey === loopKey ? leftS.rows : NO_ROWS;
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
  // U7-12: a row Make read nothing on is the owner's to fill too, wherever it sits.
  const byEar = (r: Row) => earRows.includes(r) || (!!read && read.d.rows[r].hits.length === 0);
  const earState = perRow((r): EarState | null => (!byEar(r) ? null : played && played[r].length > 0 ? "yours" : left.includes(r) ? "left" : "open"));
  const openRows = MAKE_ROWS.filter((r) => earState[r] === "open");
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

  // L288: restore this loop's fixes by ear once it is read (rebuilt on this reading, which may differ a little), then keep them.
  useEffect(() => {
    if (!read || !o.url || restored === read.loopKey) return;
    const v = loadEdits(o.url, read.loopKey);
    const t = setTimeout(() => {
      if (v) {
        setEdits({ loopKey: read.loopKey, rows: perRow((r) => {
          const e = v.edits?.[r], hits = read.d.rows[r].hits, has = (x: number) => hits.some((h) => h.step === x);
          // An added step the re-read now hears is just heard; a taken-out step it no longer hears is gone.
          if (e) return { added: (e.added ?? []).filter((x) => x >= 0 && x < read.d.steps && !has(x)), removed: (e.removed ?? []).filter(has) };
          return v.played?.[r] ? editsFor(hits, v.played[r]!, read.d.steps) : NO_EDITS;
        }) });
        setLeft({ loopKey: read.loopKey, rows: (v.left ?? []).filter((r) => MAKE_ROWS.includes(r)) });
      }
      setMute(perRow((r) => (v?.mute ?? []).includes(r)));
      setRestored(read.loopKey);
    }, 0);
    return () => clearTimeout(t);
  }, [read, o.url, restored]);
  useEffect(() => {
    if (!read || !played || !o.url || restored !== read.loopKey) return;
    const rows = MAKE_ROWS.filter((r) => editCount(edits[r]) > 0);
    const muted = MAKE_ROWS.filter((r) => mute[r]);
    storeEdits(o.url, read.loopKey, rows.length || left.length || muted.length ? { edits: Object.fromEntries(rows.map((r) => [r, edits[r]])), left, mute: muted } : null);
  }, [read, played, edits, left, mute, o.url, restored]);

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
    // U7-11: the saved row's hits come too, played round the loop.
    let steps = played ? played[row].map((h) => h.step) : [];
    if (read) {
      steps = unfoldSteps(x.pattern, read.d.steps);
      const e = editsFor(read.d.rows[row].hits, steps, read.d.steps);
      setEdits((cur) => ({ loopKey, rows: { ...(cur.loopKey === loopKey ? cur.rows : perRow(() => NO_EDITS)), [row]: e } }));
      if (left.includes(row)) setLeft({ loopKey, rows: left.filter((r) => r !== row) });
    }
    setLast((l) => ({ ...l, [row]: { id: x.id, sound: soundId(snd.preset, snd.macros), name: x.name, steps: steps.join("."), loopKey } }));
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
    setTapBar((t) => ({ ...t, [row]: Math.floor(step / 16) }));
    // Editing holds the 4 bars in view (the page doesn't turn under the pointer).
    setPage({ loopKey, page: Math.floor(step / 64) });
    // A row you tap a hit into is no longer "left empty".
    if (left.includes(row)) setLeft({ loopKey, rows: left.filter((r) => r !== row) });
    setOpen(row);
    // Hearing an edit needs Mine.
    setAb("b");
  };
  /** U7-14: every bar of the row plays what bar `bar` plays. */
  const copyBarTo = (row: Row, bar: number) => {
    if (!read) return;
    setEdits((e) => {
      const cur = e.loopKey === loopKey ? e.rows : perRow(() => NO_EDITS);
      return { loopKey, rows: { ...cur, [row]: copyBar(read.d.rows[row].hits, cur[row], bar, read.d.steps, { gridMs: read.d.gridMs, sps }) } };
    });
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
  /** Polish round: why Save is resting, in a few words (null when it can save, or once saved). */
  const saveWhy = readState !== "ready" ? null : !played || !played[open].length ? `nothing to save: ${rowName(open)} is empty` : !on[open] ? `nothing to save: ${rowName(open)} is off` : null;
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
      setLast((l) => ({ ...l, [row]: { id: res.id, sound: id, name: res.name, steps: stepsKey(row), loopKey } }));
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
    mySounds, loadSound, saveWhy, name: nameField, setName: (v: string) => setNames((n) => ({ ...n, [open]: v })), tags, save, canSave, savedRows,
    saved: { state: saveState.state, text: saveState.text, savedAs: lastRow && sameSaved(open) ? lastRow.name : null, action: action.kind },
    bpm: o.bpm,
    // Slice 2: the step grid, the rows to fill by ear, mute and solo.
    kinds, played, tapStep, earRows, earState, openRows, leaveEmpty, mute, solo, heard, toggleMute, toggleSolo, copyBarTo, tapBar,
    pinnedPage, setPage: (page: number | null) => setPage({ loopKey, page }),
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
      saved: perRow((r) => last[r]), page: pinnedPage, mySounds: mySounds.map((x) => ({ id: x.id, name: x.name, preset: x.preset })),
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

/** L289 (CR2-1, U7-10): fixing by ear shows 4 bars at a time (64 steps, ~15–17 px each), as the approved design. */
const PAGE_BARS = 4;

/**
 * The playhead in a row of steps (or the ruler) on the shown 4 bars, by the track's bars as the ruler
 * numbers them (U7-13: a jump to a bar lands on its start, and the playhead shows it there).
 */
function StepHead({ heardMs, loop, steps, bpm, page }: { heardMs: () => number; loop: LoopState; steps: number; bpm: number; page: number }) {
  const el = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    let raf = 0;
    const spsMs = 60000 / bpm / 4, per = Math.min(PAGE_BARS * 16, steps);
    const tick = () => {
      const e = el.current, h = heardMs();
      if (e) {
        const pos = (h - loop.startMs) / spsMs - page * PAGE_BARS * 16;
        const inside = h >= loop.startMs && h < loop.endMs && pos >= 0 && pos < per;
        e.style.display = inside ? "" : "none";
        if (inside) e.style.left = `${(pos / per) * 100}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heardMs, loop.startMs, loop.endMs, steps, bpm, page]);
  return <i ref={el} className={s.stHead} aria-hidden />;
}

/** Follow the playhead (L289): the page the loop is playing now, polled a few times a second. */
function usePlayPage(heardMs: () => number, loop: LoopState | null, bpm: number, on: boolean) {
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (!on || !loop) return;
    const id = setInterval(() => {
      const h = heardMs(), p = Math.floor((h - loop.startMs) / (60000 / bpm / 4) / (PAGE_BARS * 16));
      if (h >= loop.startMs && h < loop.endMs) setPage((x) => (x === p ? x : p));
    }, 120);
    return () => clearInterval(id);
  }, [heardMs, loop, bpm, on]);
  return page;
}

const KIND_WORDS: Record<HitKind, string> = { read: "Six AM heard a hit", added: "your hit", removed: "a heard hit you took out" };

/**
 * One row's steps on the shown 4 bars: a cell per 16th, no gaps between cells (a click anywhere lands
 * on the nearest step, CR2-1); the bar breaks are drawn inside the first cell of each bar.
 */
function Steps({ row, steps, page, from, kinds, muted, disabled, onTap, children }: { row: Row; steps: number; page: number; from: number; kinds: Map<number, HitKind> | null; muted: boolean; disabled: boolean; onTap: (step: number) => void; children?: React.ReactNode }) {
  const first = page * PAGE_BARS * 16, n = Math.min(PAGE_BARS * 16, steps - first);
  return (
    <div className={s.steps} data-muted={muted ? "" : undefined} style={{ gridTemplateColumns: `repeat(${Math.min(PAGE_BARS * 16, steps)}, minmax(0, 1fr))` }}>
      {Array.from({ length: n }, (_, j) => {
        const i = first + j, k = i % 16, v = kinds?.get(i);
        return <button key={i} type="button" className={s.st} data-k={v} data-beat={k % 4 === 0 ? "" : undefined} data-bar={k === 0 && j > 0 ? "" : undefined} disabled={disabled} aria-pressed={v === "read" || v === "added"}
          aria-label={`${rowName(row)}, bar ${from + Math.floor(i / 16)}, step ${k + 1}: ${v ? KIND_WORDS[v] : "empty"}`} onClick={() => onTap(i)} />;
      })}
      {children}
    </div>
  );
}

/**
 * R5 (U7-13): the shown bars over the rows. Each bar number is a real button (≥ 24 px) that plays from
 * that bar's first step; a click anywhere else on the ruler plays from the nearest 16th.
 */
function Ruler({ steps, page, from, onJump, disabled, children }: { steps: number; page: number; from: number; onJump: (step: number) => void; disabled: boolean; children?: React.ReactNode }) {
  const first = page * PAGE_BARS * 16, per = Math.min(PAGE_BARS * 16, steps), n = Math.min(per, steps - first);
  const bars = Math.ceil(n / 16);
  const click = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || (e.target as HTMLElement).closest("button")) return;
    const r = e.currentTarget.getBoundingClientRect();
    onJump(first + Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * per))));
  };
  return (
    <div className={s.drRuler} onClick={click} title={disabled ? undefined : "Click a spot to play from there"}>
      {Array.from({ length: bars }, (_, b) => (
        <button key={b} type="button" className={s.rbar} disabled={disabled} style={{ left: `${((b * 16) / per) * 100}%` }} onClick={() => onJump(first + b * 16)} aria-label={`Play from bar ${from + page * PAGE_BARS + b}`}>{from + page * PAGE_BARS + b}</button>
      ))}
      {Array.from({ length: bars - 1 }, (_, b) => <i key={b} className={s.rtick} style={{ left: `${(((b + 1) * 16) / per) * 100}%` }} aria-hidden />)}
      {children}
    </div>
  );
}

/** L289 (polish round): which 4 bars are shown, as pages: "‹ 76–79 ›". The arrows hold a page; the range, pressed while held, follows the playhead again. */
function PageSwitch({ pages, page, pinned, from, onPage }: { pages: number; page: number; pinned: boolean; from: number; onPage: (p: number | null) => void }) {
  if (pages <= 1) return <span />;
  const a = from + page * PAGE_BARS, b = a + PAGE_BARS - 1;
  return (
    <span className={s.pages} role="group" aria-label="Bars shown">
      <button type="button" className={s.pgArrow} disabled={page === 0} onClick={() => onPage(page - 1)} aria-label={`Show bars ${a - PAGE_BARS}–${a - 1}`}>‹</button>
      <button type="button" className={s.pgRange} data-held={pinned ? "" : undefined} onClick={() => onPage(pinned ? null : page)}
        title={pinned ? "Held on these bars: press to follow the playhead again" : "Following the playhead: press to hold these bars"}>{a}–{b}</button>
      <button type="button" className={s.pgArrow} disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label={`Show bars ${b + 1}–${b + PAGE_BARS}`}>›</button>
    </span>
  );
}

export function DrumsLegend() {
  return (
    <span className={s.legend} aria-label="What the hits mean">
      <span><i data-k="read" />Six AM heard</span><span><i data-k="added" />you added</span><span><i data-k="removed" />you took out</span>
    </span>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const list = (xs: string[], last: string) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${last} ${xs[xs.length - 1]}`);
/**
 * R3b, L273b: why rows start empty, in the words of the rows still open (one line at 1440, CR2-3); a
 * read row Six AM heard nothing on says so (U7-12).
 */
function whyEmpty(open: Row[], left: Row[], earRows: Row[]): string {
  if (!open.length) return left.length ? `${list(left.map((r) => rowName(r)), "and")} left empty on purpose.` : "Every row has its hits.";
  const ear = open.filter((r) => earRows.includes(r)), heard = open.filter((r) => !earRows.includes(r));
  const parts: string[] = [];
  if (ear.length) parts.push(`Six AM can’t hear ${list(ear.map((r) => EAR_WORDS[r].plural), "or")} yet, so ${ear.length === 1 ? `${rowName(ear[0])} starts` : "these start"} empty and the loop sounds thinner. Some may be on Closed hat.`);
  if (heard.length) parts.push(`No ${list(heard.map((r) => EAR_WORDS[r].noun), "or")} heard in this loop.`);
  return parts.join(" ");
}

export function DrumsMiddle({ m, loop, from, playing, heardMs, onJump }: { m: DrumsModel; loop: LoopState | null; from: number | null; playing: boolean; heardMs: () => number; onJump: (ms: number) => void }) {
  const steps = m.read?.d.steps ?? (loop ? Math.max(16, Math.round((loop.endMs - loop.startMs) / (60000 / m.bpm / 4))) : 64);
  const wait = waitLine(m, loop, playing);
  const off = !!wait;
  const row = m.open, snd = m.sounds[row], ticks = m.ticks[row]?.macros;
  const noun = drumNoun(snd.preset);
  const fromBar = from ?? 1;
  const live = loop?.state === "memory" && !off;
  const spsMs = 60000 / m.bpm / 4;
  const pages = Math.max(1, Math.ceil(steps / (PAGE_BARS * 16)));
  const playPage = usePlayPage(heardMs, live ? loop : null, m.bpm, pages > 1 && m.pinnedPage === null);
  const page = Math.min(pages - 1, m.pinnedPage ?? playPage);
  // R5 (U7-13): a step's start by the track's bars (a bar's first step is the bar's start), kept inside the loop.
  const jumpTo = (step: number) => {
    if (!loop) return;
    if (m.pinnedPage !== null) m.setPage(null); // a jump follows the playhead again
    onJump(Math.max(loop.startMs, Math.min(loop.endMs - 1, loop.startMs + step * spsMs)));
  };
  let line: React.ReactNode;
  const rowRead = m.read?.d.rows[row], rowOff = !!rowRead?.doubtful && !m.anyway.includes(row);
  const ear = m.earState[row];
  // U4: a row that is off gets the reason, not knob tips.
  if (rowOff) line = `Mentor: ${cap((rowRead?.why ?? "").replace(/: off in Mine$/, ""))}, so Mine leaves this row out.`;
  else if (m.suggesting === row) line = `Measuring the ${noun} against the row's 20 sounds…`;
  else if (!m.read?.targets[row]) line = <span className={s.faintLine}>{ear ? `Nothing to compare with here: pick a ${EAR_WORDS[row].noun} by ear, then tap its hits in.` : `No ${rowTitle(row)} hits in this loop to compare with.`}</span>;
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
    const head = off ? null
      : st === "open" ? <><span>Your turn: listen for {EAR_WORDS[r].listen} and tap it in</span> · <button type="button" className={s.textBtn} onClick={() => m.leaveEmpty(r, true)}>Leave empty</button></>
      : st === "left" ? <><span>Left empty, so the loop has no {EAR_WORDS[r].noun}</span> · <button type="button" className={s.textBtn} onClick={() => m.leaveEmpty(r, false)}>Undo</button></>
      : rr?.doubtful ? (doubtful
        ? <><span>{rr.note ?? "Probably bleed"}: off in Mine</span> · <button type="button" className={s.textBtn} title={rr.why ?? undefined} onClick={() => m.playAnyway(r)}>Play anyway</button></>
        : <><span>Playing a row Six AM doubted</span> · <button type="button" className={s.textBtn} title="Leave this row out of Mine again, as the reading suggests" onClick={() => m.backToOff(r)}>Back to off</button></>)
      : null;
    const under = head ? <div className={s.under} data-yours={st === "open" ? "" : undefined}>{head}</div> : null;
    return [
      <button key={`${r}-n`} type="button" className={s.rname} aria-pressed={lit} onClick={() => m.setOpen(r)} title={`${rowName(r)}: ${drumSoundName(m.sounds[r].preset)}`}>
        <span>{rowName(r)}{doubtful && <span className={s.drOff}> off</span>}</span>
        <small>{drumSoundName(m.sounds[r].preset)}{m.savedRows[r] && " · saved"}</small>
      </button>,
      <div key={`${r}-s`} className={s.stCell} data-open={st === "open" && !off ? "" : undefined}>
        <Steps row={r} steps={steps} page={page} from={fromBar} kinds={off ? null : m.kinds?.[r] ?? null} muted={quiet || doubtful} disabled={off || !m.read} onTap={(i) => m.tapStep(r, i)}>
          {live && loop && <StepHead heardMs={heardMs} loop={loop} steps={steps} bpm={m.bpm} page={page} />}
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
  const why = whyEmpty(o, MAKE_ROWS.filter((r) => m.earState[r] === "left"), m.earRows);
  return (
    <div className={s.drums}>
      <div className={s.dr2} data-fill={m.shelf ? undefined : ""} role="group" aria-label="Drum rows">
        <span className={s.lbl} data-head="">Six AM heard these</span>
        <Ruler steps={steps} page={page} from={fromBar} onJump={jumpTo} disabled={!loop || off}>
          {live && loop && <StepHead heardMs={heardMs} loop={loop} steps={steps} bpm={m.bpm} page={page} />}
        </Ruler>
        <PageSwitch pages={pages} page={page} pinned={m.pinnedPage !== null} from={fromBar} onPage={m.setPage} />
        {heardRowsList.flatMap(rowView)}
        <div className={s.divide} data-done={o.length ? undefined : ""} role="status">
          {/* CR2-3, U7-18: the count until every row is filled or left empty, then "Nothing left to fill". */}
          <span className={s.count} data-done={o.length ? undefined : ""}>{o.length ? `${plural(o.length, "row", "rows")} to fill by ear` : "Nothing left to fill"}</span>
          <span className={s.lbl} title={why}>{why}</span>
        </div>
        {m.earRows.flatMap(rowView)}
      </div>
      <Shelf m={m} row={row} playing={playing} off={off} rowOff={rowOff} copy={(() => {
        // U7-14 (polish round): "Copy bar N to every bar" sits in the sound strip, so the rows never shift.
        const cb = m.tapBar[row] ?? page * PAGE_BARS;
        return !off && !!m.played && steps > 16 && m.played[row].some((h) => Math.floor(h.step / 16) === cb)
          ? <button type="button" className={s.textBtn} onClick={() => m.copyBarTo(row, cb)} title="Every bar of this row plays what this bar plays now (a second tap on a step still undoes)">Copy bar {fromBar + cb} to every bar</button> : null;
      })()} />
      {wait ? <p className={s.drWait} role="status">{wait}</p> : (
        <div className={s.drSuggest}>
          <p className={s.suggest} aria-live="polite">{line}</p>
          {/* P6: local analysis by synthesis; it only moves the gold ticks. */}
          {/* U10: once the ticks are placed for these knobs it is a plain note, not a greyed button. */}
          {rowOff || !m.read?.targets[row] || (m.suggestedNow[row] && m.suggesting !== row)
            ? null
            : <button className={s.ghost} onClick={() => m.suggestNow(row)} disabled={m.suggesting !== null}
              title="Places gold ticks where the knobs come closest to the original, and names a starting sound that gets clearly closer; it never turns a knob">{m.suggesting === row ? "Suggesting…" : `Suggest for ${rowTitle(row)}`}</button>}
          {/* CR2-2: with A/B in the one bottom bar, the original bass under both sits here. */}
          <button className={s.ghost} aria-pressed={m.bed} onClick={() => m.setBed(!m.bed)} title="Plays the original bass under both A and B, so you judge the drums in the groove">{m.bed ? "Bass under both: on" : "Bass under both: off"}</button>
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
function Shelf({ m, row, playing, off, rowOff, copy }: { m: DrumsModel; row: Row; playing: boolean; off: boolean; rowOff: boolean; copy: React.ReactNode }) {
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
          {copy && <span className={s.shelfCloser}>{copy}</span>}
        </div>
        <div className={s.drKnobs} data-off={off ? "" : undefined}>
          {knobsOf(snd.preset).map((id) => (
            <Knob key={`${row}-${snd.preset}-${id}`} id={id} spec={drumKnobSpec(snd.preset, id)} wordOf={(v) => drumKnobShown(snd.preset, id, v, m.bpm)} detailOf={(v) => drumKnobDetail(snd.preset, id, v)} value={snd.macros[id] ?? 0} sug={off || rowOff ? undefined : ticks?.[id]}
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

/**
 * CR2-2: one bottom bar, as the approved design: A/B at the same loudness, the open row's closeness
 * (P8, U1; a row filled by ear has none and says so), the name, and Save ("Save kick"; "Saved" once
 * saved, until the sound or its hits change).
 */
export function DrumsSaveBar({ m }: { m: DrumsModel }) {
  const row = m.open;
  const allMuted = m.allOff && MAKE_ROWS.some((r) => m.on[r]);
  const offRow = !!m.read?.d.rows[row].doubtful && !m.anyway.includes(row);
  const noun = drumNoun(m.sounds[row].preset);
  const done = !!m.saved.savedAs && m.saved.action === "none";
  return (
    <div className={`${s.saveBar} ${s.drBar}`}>
      <div className={s.ab} role="group" aria-label="Compare at the same loudness">
        <button aria-pressed={m.ab === "a"} onClick={() => m.setAb("a")} title="The original drums, at the same loudness as Mine">A · Original drums</button>
        <button aria-pressed={m.ab === "b"} onClick={() => m.setAb("b")} disabled={!m.mineAny || m.allOff} title={allMuted ? "Every row is muted: unmute a row to hear Mine" : m.allOff ? "Every row is off: press Play anyway on a row to hear Mine" : m.mineAny ? "Mine, at the same loudness as the original" : "Mine plays once the loop is read"}>B · Mine</button>
      </div>
      <span className={s.drScore} title="How close this row's hit measures to the original's (its sound across its own bands, the kick's note, the hats' width): it rises as you follow this row's gold ticks. Numbers only.">
        {/* N3: an off row isn't in Mine; a row filled by ear has nothing to compare with (CR2-3). */}
        {!m.read?.targets[row] ? <>no closeness score for {EAR_WORDS[row].noun}</> : <>closeness <b>{offRow ? "–" : m.rowCloseness?.[row]?.score ?? "–"}</b> / 100</>}
      </span>
      <input id="save-name" name="sound-name" aria-label="Name for the saved sound" autoComplete="off" spellCheck={false} className={s.input} value={m.name} maxLength={60} onChange={(e) => m.setName(e.target.value)} disabled={m.readState !== "ready"} title={m.tags.join(" · ")} />
      {(m.saved.state === "error" || (!m.canSave && m.saveWhy)) && <span className={s.saved} role="status">{m.saved.state === "error" ? m.saved.text : m.saveWhy}</span>}
      <button className={s.gold} onClick={() => void m.save()} disabled={!m.canSave}>{m.saved.state === "saving" ? "Saving…" : done ? "Saved" : `Save ${noun}`}</button>
    </div>
  );
}
