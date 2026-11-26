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
import { foldMelodyRow, type MelNote, type MelodyReading, type MelodyRowSound, type MelodyTarget } from "@/lib/make/melody-make";
import { rankChords, voiceChord, type ChordCell, type ChordsReading } from "@/lib/make/chords-read";
import { addHit, cardsFor, chordPcs, editsFromSaved, foldChordNames, heldHits, hitsOf, keyChords, moveHit, normalChord, notesMatch, parseChord, sameHits, shortHits, unsureCells, withEdits, type CellEdit, type Edits, type Hit } from "@/lib/make/chords-mine";
import { isMelodySound, melodyNoun, saveAction, soundId, suggestMelodyName, suggestMelodyTags, type MelodySound } from "@/lib/make/library";
import { MELODY_ROWS, MELODY_ROW_NAMES, POLY_KNOBS, POLY_KNOB_SPECS, ROW_DEFAULT, clampPolyMacros, kindOf, melodyPreset, melodyPresetIds, melodyRowOf, polyKnobWord, polyMoves, polySuggestLine, presetId, type MelodyPresetId, type MelodyRow, type PolyMacros } from "@/lib/make/poly-synth";
import type { Scale } from "@/lib/synths/theory";
import { ApiError, mentorApi } from "@/lib/mentor/client";
import { Knob } from "@/components/ui/knob";
import { Playhead, useShort } from "./make-drums";
import { ChordPanel, ChordTiles } from "./make-chords";
import ch from "./chords.module.css";
import s from "./lab.module.css";

const loopKeyOf = (l: LoopState | null) => (l?.state === "memory" ? `${Math.round(l.startMs)}-${Math.round(l.endMs)}` : null);
type ReadState = "idle" | "reading" | "ready" | "nonotes" | "error";
/** Phase 6 slice 1: what reader A gave for this loop (the chords, and a lead line when the melody split found one). */
type ReadRaw = { loopKey: string; chords: ChordsReading; lead: MelNote[]; targets: Record<MelodyRow, MelodyTarget | null>; cellChroma: number[][]; levelDb: number; lufs: number; samples: number; rate: number; ms: number };
type Read = ReadRaw & { d: MelodyReading };
/** Slice 1: the Lead row stays off until its own slice (K7): read note by note it is rough (H4), and it can't be edited yet. */
const LEAD_WHY = "The lead, read note by note, is rough for now (fixing it by hand comes later): off in Mine";
type Sound = { preset: MelodyPresetId; macros: Required<PolyMacros> };
const fresh = (p: MelodyPresetId): Sound => ({ preset: p, macros: clampPolyMacros(p, undefined) });
const perRow = <T,>(f: (r: MelodyRow) => T) => Object.fromEntries(MELODY_ROWS.map((r) => [r, f(r)])) as Record<MelodyRow, T>;
const TEAL = "#23b3a5";

export type MelodyOpts = { tr: RefObject<LabTransport | null>; active: boolean; loop: LoopState | null; bpm: number; keyName: string; scale: string; code: string; title: string; url: string; fromBar?: number | null };
/** Slice 2 (K5): the closest chord name for the owner's own notes (the reader's ranking, in the key), and whether they are exactly that chord. */
function closestChord(notes: number[], key?: { key: string; scale: Scale }): { name: string; exact: boolean } | null {
  if (!notes.length) return null;
  const chroma = new Array(12).fill(0), bass = new Array(12).fill(0);
  for (const n of notes) chroma[((n % 12) + 12) % 12] = 1;
  bass[((Math.min(...notes) % 12) + 12) % 12] = 1;
  const best = rankChords(chroma, bass, key)[0];
  if (!best) return null;
  const pcs = new Set(notes.map((n) => ((n % 12) + 12) % 12)), tpl = chordPcs(best.name);
  return { name: best.name, exact: tpl.length === pcs.size && tpl.every((p) => pcs.has(p)) };
}
/** What a cell plays in Mine: the owner's own notes, else the chord in its standard voicing (K3, K5). */
const cellNotes = (c: ChordsReading, edits: Edits, i: number): number[] => {
  const own = edits[i]?.notes, x = c.cells[i];
  return own?.length ? own : x?.root !== null && x?.root !== undefined && x.type ? voiceChord(x.root, x.type, c.register) : [];
};
/** Mine's chords as notes on the 16th grid, the way melody-make.ts plays them. */
function mineNotesOf(c: ChordsReading, edits: Edits): MelNote[] {
  const sps = 60 / c.bpm / 4, out: MelNote[] = [];
  for (const e of c.events) {
    if (!c.cells[e.cell]?.name) continue;
    for (const midi of cellNotes(c, edits, e.cell)) out.push({ t: e.t, dur: e.dur, midi, vel: e.vel, step: e.step, off: e.off, durSteps: Math.max(0.25, Math.round((e.dur / sps) * 100) / 100) });
  }
  return out;
}

/** A planted chord (graders, H14): Make's guess replaced on one cell, as if the reader had misread it. */
type Plant = { name: string; unsure: boolean };

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
  const [readS, setReadS] = useState<ReadRaw | null>(null);
  // Slice 1 (K4): the names picked per cell (Mine), the planted guesses (graders), the open cell and the panel's switches.
  const [editsS, setEdits] = useState<{ loopKey: string | null; edits: Edits }>({ loopKey: null, edits: {} });
  // Slice 2 (K5, K6): the open cell on the piano, and the hit picked on its timing strip.
  const [keys, setKeys] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [plantsS, setPlants] = useState<{ loopKey: string | null; cells: Record<number, Plant> }>({ loopKey: null, cells: {} });
  const [openCellS, setOpenCell] = useState<{ loopKey: string | null; cell: number } | null>(null);
  const [all, setAll] = useState(true); // "All N X bars", on by default (L262)
  const [more, setMore] = useState(false);
  const [hearS, setHear] = useState<{ cell: number; what: string } | null>(null);
  const [state, setState] = useState<{ loopKey: string; state: ReadState; error?: string } | null>(null);
  const [anywayS, setAnyway] = useState<{ loopKey: string | null; rows: MelodyRow[] }>({ loopKey: null, rows: [] });
  const [ab, setAb] = useState<"a" | "b">("a");
  const [bed, setBed] = useState(true); // P7: the original drums under both A and B
  const [mineS, setMine] = useState<{ key: string; rowCloseness: Record<MelodyRow, { score: number; distance: number } | null>; gainDb: number; rowGainsDb: Record<MelodyRow, number | null>; ms: number } | null>(null);
  const [names, setNames] = useState<Record<MelodyRow, string | null>>(() => perRow(() => null));
  const [last, setLast] = useState<Record<MelodyRow, { id: string; sound: string; name: string } | null>>(() => perRow(() => null));
  const [saveState, setSaveState] = useState<{ state: "idle" | "saving" | "error"; text?: string }>({ state: "idle" });
  const [mySounds, setMySounds] = useState<MelodySound[]>([]);

  const raw = readS && readS.loopKey === loopKey ? readS : null;
  const edits = useMemo(() => (editsS.loopKey === loopKey ? editsS.edits : {}), [editsS, loopKey]);
  const plants = useMemo(() => (plantsS.loopKey === loopKey ? plantsS.cells : {}), [plantsS, loopKey]);
  // Make's guess per cell (with any planted misread), which of them are unsure, then Mine's chords with the picks.
  const guess = useMemo<ChordsReading | null>(() => {
    if (!raw) return null;
    const cells = raw.chords.cells.map((c, i): ChordCell => {
      const p = plants[i] ? parseChord(plants[i].name) : null;
      if (!p) return c;
      const was = c.name ? [{ name: c.name, root: c.root ?? 0, type: c.type ?? "maj", score: c.score }] : [];
      return { ...c, name: p.name, root: p.root, type: p.type, alternatives: [...was, ...c.alternatives.filter((a) => a.name !== p.name)] };
    });
    return { ...raw.chords, cells };
  }, [raw, plants]);
  const unsure = useMemo(() => {
    if (!guess) return [];
    const u = unsureCells(raw!.chords.cells);
    return u.map((x, i) => (plants[i] ? plants[i].unsure : x));
  }, [guess, raw, plants]);
  const mineChords = useMemo(() => (guess ? withEdits(guess, edits) : null), [guess, edits]);
  const read = useMemo<Read | null>(() => {
    if (!raw || !mineChords) return null;
    const chordNotes = mineNotesOf(mineChords, edits), row = (notes: MelNote[]) => ({ notes, doubtful: false, why: null, note: null });
    const d: MelodyReading = { rows: { chords: row(chordNotes), lead: row(raw.lead) }, steps: mineChords.steps, bars: mineChords.bars, lead: raw.lead.length > 0, chords: chordNotes.length > 0, tuningCents: mineChords.tuningCents };
    d.rows.lead = { ...d.rows.lead, doubtful: raw.lead.length > 0, why: raw.lead.length ? LEAD_WHY : null, note: raw.lead.length ? "Lead editing comes later" : null };
    return { ...raw, d };
  }, [raw, mineChords, edits]);
  const firstUnsure = Math.max(0, unsure.findIndex(Boolean));
  const openCell = openCellS && openCellS.loopKey === loopKey && guess && openCellS.cell < guess.cells.length ? openCellS.cell : firstUnsure;
  const hear = hearS && hearS.cell === openCell ? hearS.what : null;
  const readState: ReadState = state && state.loopKey === loopKey ? state.state : "idle";
  // The rows that hold notes: Chords, Lead, or both (a single line is a Lead alone, L242).
  const rows: MelodyRow[] = read ? MELODY_ROWS.filter((r) => read.d.rows[r].notes.length > 0) : ["chords"];
  if (!rows.length) rows.push("chords");
  const open: MelodyRow = rows.includes(openS) ? openS : rows[0];
  const anyway = useMemo(() => (anywayS.loopKey === loopKey ? anywayS.rows : []), [anywayS, loopKey]);
  const on = useMemo(() => perRow((r) => !!read && read.d.rows[r].notes.length > 0 && (!read.d.rows[r].doubtful || anyway.includes(r))), [read, anyway]);
  const signature = (x: Record<MelodyRow, Sound>, onRows: Record<MelodyRow, boolean>) => MELODY_ROWS.map((r) => `${x[r].preset}:${POLY_KNOBS.map((k) => x[r].macros[k].toFixed(3)).join(",")}:${onRows[r] ? 1 : 0}`).join("|");
  const editSig = `${mineChords?.cells.map((c) => c.name).join(",") ?? ""}|${JSON.stringify(edits)}`;
  const mineKeyNow = read ? `${read.loopKey}|${signature(sounds, on)}|${editSig}` : null;
  const mine = mineS && read && mineS.key.startsWith(`${read.loopKey}|`) ? mineS : null;

  const suggest = useCallback(async (r: { targets: Record<MelodyRow, MelodyTarget | null> }, row: MelodyRow, snd: Sound, before: PolyMacros | null) => {
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
    // Slice 1 (K2): reader A ("dsp") names the chords per bar; the worker zeroes its copy (C2).
    cl().chordsRead({ left, right, rate, bpm: o.bpm, key: o.keyName && scale ? { key: o.keyName, scale } : undefined, reader: "dsp" }).then(async (res) => {
      const lead = res.lead.from === "row" ? res.lead.notes : [];
      console.info(`[make] chords read in ${res.ms} ms: ${res.chords.cells.map((c) => c.name || "-").join(" ")}, ${res.chords.events.length} chords, lead ${lead.length} notes`);
      if (!res.chords.events.length) { setState({ loopKey: key, state: "nonotes" }); return; }
      const r: ReadRaw = { loopKey: key, chords: res.chords, lead, targets: res.targets, cellChroma: res.cellChroma, levelDb: res.levelDb, lufs: res.lufs, samples, rate, ms: res.ms };
      setReadS(r);
      setEdits({ loopKey: key, edits: {} });
      setOpenCell(null); setHear(null); setMore(false); setAll(true); setKeys(false); setSel(null);
      setAb("b"); // CS1-4: once the loop is read, Make's chords are what you hear first
      setState({ loopKey: key, state: "ready" });
      for (const row of MELODY_ROWS) if (r.targets[row]) await suggest(r, row, soundsRef.current[row], null);
    }, (e) => setState({ loopKey: key, state: "error", error: `Make couldn't read the chords: ${e instanceof Error ? e.message : String(e)}` }));
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
    // K8: a saved chords sound brings its chord names back onto this loop's bars (by place in the repeat).
    let sig = "";
    if (row === "chords" && guess && loopKey && x.pattern.chords?.length) {
      const back = editsFromSaved(guess.cells, x.pattern.chords, x.pattern.bars);
      setEdits({ loopKey, edits: back });
      sig = `${withEdits(guess, back).cells.map((c) => c.name).join(",")}|${JSON.stringify(back)}`;
    } else if (row === "chords") sig = editSig;
    setSounds((s0) => ({ ...s0, [row]: snd }));
    setNames((n) => ({ ...n, [row]: x.name }));
    setLast((l) => ({ ...l, [row]: { id: x.id, sound: soundId(snd.preset, snd.macros) + (row === "chords" ? `|${sig}` : ""), name: x.name } }));
    setTicks((t) => ({ ...t, [row]: null }));
    setOpen(row);
    if (read) void suggest(read, row, snd, null);
  };
  const playAnyway = (row: MelodyRow) => setAnyway({ loopKey, rows: [...anyway.filter((r) => r !== row), row] });
  const backToOff = (row: MelodyRow) => setAnyway({ loopKey, rows: anyway.filter((r) => r !== row) });

  // Save the open row (P9): its sound, and its notes folded to a 1–16-bar repeat, in the track's key.
  // K8: the chords row's identity includes its chord names, so changing a chord makes a new save.
  const sidOf = (r: MelodyRow) => soundId(sounds[r].preset, sounds[r].macros) + (r === "chords" ? `|${editSig}` : "");
  const cur = sounds[open], sid = sidOf(open);
  const suggested = suggestMelodyName(cur.preset, cur.macros, o.title);
  const lastRow = last[open], nameRaw = names[open];
  const nameField = nameRaw === null || (lastRow && lastRow.sound !== sid && nameRaw === lastRow.name) ? suggested : nameRaw;
  const nameNow = nameField.trim() || suggested;
  const action = saveAction({ sound: sid, name: nameNow }, lastRow);
  const tags = scale && o.keyName ? suggestMelodyTags(cur.preset, o.keyName, scale, o.bpm, o.title, cur.macros) : [];
  const savedRows = perRow((r) => !!last[r] && last[r]!.sound === sidOf(r));
  const canSave = readState === "ready" && on[open] && !!scale && !!o.keyName && saveState.state !== "saving" && action.kind !== "none";
  // The saved loop; a chords row carries its chord names too (K8), folded to the same repeat as its notes.
  const patternOf = (row: MelodyRow) => {
    const f = foldMelodyRow(read!.d.rows[row].notes, read!.d.steps);
    return row === "chords" && mineChords ? { ...f, chords: foldChordNames(mineChords.cells, f.bars, edits) } : f;
  };
  const save = async (row: MelodyRow = open, nameOverride?: string) => {
    if (!read || !scale || !o.keyName) return;
    const snd = sounds[row], id = sidOf(row), lr = last[row];
    const nm = (nameOverride ?? (row === open ? nameNow : suggestMelodyName(snd.preset, snd.macros, o.title))).trim();
    const act = saveAction({ sound: id, name: nm }, lr);
    if (act.kind === "none" || !on[row]) return;
    setSaveState({ state: "saving" });
    try {
      const api = mentorApi(o.code);
      const res = act.kind === "patch"
        ? await api.patchSound(act.id, { name: nm })
        : await api.addSound({
          name: nm, part: "other", preset: snd.preset, macros: snd.macros, pattern: patternOf(row),
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

  // ── Slice 1 (K4): the listening panel's actions ──
  const sps = 60 / o.bpm / 4;
  const cellStartMs = (i: number) => (o.loop ? o.loop.startMs + (guess?.cells[i]?.startStep ?? 0) * sps * 1000 : 0);
  /** From the start of the open cell's bar, playing (a tap hears the chord in the loop at once). */
  const playFrom = (i: number) => { const t = tr.current; if (!t || !o.loop) return; t.seek(cellStartMs(i)); if (!t.playing) t.play(); };
  // CS1-6: "All" is on again each time a bar opens (L262's default).
  const openChord = (i: number) => { if (!guess || i < 0 || i >= guess.cells.length) return; setOpenCell({ loopKey, cell: i }); setHear(null); setMore(false); setAll(true); setKeys(false); setSel(null); };
  /**
   * The cells an edit changes with "All" (CS1-6, CS1-10, CS1-11): every other cell Make heard as the same
   * chord (its read name), whatever it plays in Mine now, so a pick never reaches a bar Make heard differently
   * and the count is the open bar's own group. Stable through edits, so the switch never vanishes.
   */
  const twinsOf = (i: number) => {
    if (!guess || !guess.cells[i]?.name) return [];
    const g = guess.cells[i].name;
    return guess.cells.map((_, k) => k).filter((k) => k !== i && guess.cells[k].name === g);
  };
  /** The switch's chord name: what Make heard in the group. */
  const twinName = (i: number) => guess?.cells[i]?.name ?? "";
  const pickChord = (name: string, opts: { all?: boolean; cell?: number; hear?: boolean } = {}) => {
    const n = normalChord(name), i = opts.cell ?? openCell;
    if (!n || !guess || !loopKey) return false;
    const cells = [i, ...((opts.all ?? all) ? twinsOf(i) : [])];
    // A card replaces the cell's own notes (the chord's standard voicing again); its own hits stay.
    // "Make's guess" gives each cell back its own guess (CS1-10).
    const restore = guess.cells[i]?.name === n;
    editCells(cells, (e, k) => ({ ...e, name: restore || guess.cells[k]?.name === n ? undefined : n, notes: undefined }));
    if (opts.hear !== false) { setHear({ cell: i, what: n }); setAb("b"); playFrom(i); }
    return true;
  };
  // ── Slice 2 (K5, K6): the piano and the timing strip ──
  /** Edits some cells; an edit left with nothing in it is dropped (the cell is Make's again). */
  function editCells(cells: number[], f: (e: CellEdit, k: number) => CellEdit) {
    if (!loopKey) return;
    setEdits((p) => {
      const next: Edits = { ...(p.loopKey === loopKey ? p.edits : {}) };
      for (const k of cells) {
        const e = f(next[k] ?? {}, k), clean: CellEdit = {};
        if (e.name) clean.name = e.name;
        if (e.notes?.length) clean.notes = e.notes;
        if (e.hits) clean.hits = e.hits;
        if (Object.keys(clean).length) next[k] = clean; else delete next[k];
      }
      return { loopKey, edits: next };
    });
  }
  /** An edit is heard at once: B, and from the bar's start when paused (while playing, the loop runs on and Mine swaps in place). */
  const hearEdit = () => { const t = tr.current; if (t && !t.playing) playFrom(openCell); };
  const keyOf = o.keyName && scale ? { key: o.keyName, scale } : undefined;
  const notesNow = (i: number) => (mineChords ? cellNotes(mineChords, edits, i) : []);
  /** A key on the piano: the note in or out of the open cell's chord (with "All", its twins get the same notes). Never the last note. */
  const toggleNote = (midi: number) => {
    if (!guess || !mineChords || !Number.isInteger(midi) || midi < 24 || midi > 108) return null;
    const cur = notesNow(openCell), notes = cur.includes(midi) ? cur.filter((m) => m !== midi) : [...cur, midi].sort((a, b) => a - b);
    if (!notes.length) return null;
    const near = closestChord(notes, keyOf);
    const voiced = near ? parseChord(near.name) : null;
    // Back to the plain voicing of a chord: keep only its name (a card's state), not the notes.
    const plain = near && voiced && near.exact && voiceChord(voiced.root, voiced.type, mineChords.register).join() === notes.join();
    editCells([openCell, ...(all ? twinsOf(openCell) : [])], (e, k) => ({ ...e, name: near && guess.cells[k]?.name !== near.name ? near.name : undefined, notes: plain ? undefined : notes }));
    setHear({ cell: openCell, what: near?.name ?? "" }); setAb("b"); hearEdit();
    return { notes, name: near?.name ?? null, exact: !!near?.exact };
  };
  /** The open cell's hits on the strip: its own, else the read ones. */
  const hitsNow = (i: number) => (edits[i]?.hits ?? (mineChords ? hitsOf(mineChords, i) : []));
  const stepsOf = (i: number) => guess?.cells[i]?.steps ?? 16;
  /** New hits for the open cell (and, with "All", every twin of the same length). */
  const setCellHits = (hits: Hit[]) => {
    const st = stepsOf(openCell);
    editCells([openCell, ...(all ? twinsOf(openCell).filter((k) => stepsOf(k) === st) : [])], (e) => ({ ...e, hits }));
    setAb("b"); hearEdit();
  };
  const presetHits = (p: "short" | "held") => { if (!mineChords) return; setCellHits(p === "held" ? heldHits(stepsOf(openCell)) : shortHits(withEdits(guess!, {}), openCell)); setSel(null); };
  /** A tap on the strip, or a move on the picked hit. Returns false when it doesn't fit. */
  const hitOp = (op: "select" | "add" | "earlier" | "later" | "shorter" | "longer" | "remove", at?: number) => {
    const hs = hitsNow(openCell), st = stepsOf(openCell);
    if (op === "select") { setSel(at === undefined || at === sel || !hs[at] ? null : at); return true; }
    if (op === "add") { const nx = at === undefined ? null : addHit(hs, at, st); if (!nx) return false; setCellHits(nx); setSel(null); return true; }
    if (sel === null) return false;
    const nx = moveHit(hs, sel, op, st);
    if (!nx) return false;
    setCellHits(nx);
    setSel(op === "remove" ? null : nx.findIndex((h) => h.at === (op === "earlier" ? hs[sel].at - 1 : op === "later" ? hs[sel].at + 1 : hs[sel].at)));
    return true;
  };
  /** ↺ Reset: the open cell back to Make's chord and times. */
  const resetCell = () => { editCells([openCell], () => ({})); setSel(null); };
  const setPiano = (on: boolean) => { setKeys(on); setSel(null); setMore(false); };

  /** A card: hear it in the loop and use it (L262); tapping the one that is playing pauses. */
  const tapCard = (name: string, playing: boolean) => {
    if (playing && hear === name && ab === "b") { tr.current?.pause(); return; }
    pickChord(name);
  };
  /** The Track button: this bar of the original (A), from its start; again to stop. */
  // shortcut: it plays on through the loop after the bar instead of stopping at its end; add a bar-long stop if testers find it confusing.
  const tapTrack = (playing: boolean) => {
    if (playing && hear === "orig" && ab === "a") { tr.current?.pause(); setHear(null); return; }
    setHear({ cell: openCell, what: "orig" }); setAb("a"); playFrom(openCell);
  };
  const keyList = useMemo(() => keyChords(o.keyName, scale), [o.keyName, scale]);
  const openHits = hitsNow(openCell);
  const shortNow = guess ? shortHits(withEdits(guess, {}), openCell) : [];
  const ownNotes = edits[openCell]?.notes;
  const nearOwn = ownNotes ? closestChord(ownNotes, keyOf) : null;
  const chordsView = guess && mineChords ? {
    cells: guess.cells.map((g, i) => ({
      i, bar: g.bar, startStep: g.startStep, steps: g.steps, guess: g.name, name: mineChords.cells[i].name, unsure: !!unsure[i] && edits[i] === undefined,
      edited: edits[i] !== undefined, cards: cardsFor(g), score: g.score,
      hits: mineChords.events.filter((e) => e.cell === i).map((e) => { const at = Math.max(0, e.t / sps - g.startStep); return { at, len: Math.max(0.25, Math.min(g.steps - at, e.dur / sps)) }; }),
    })),
    open: openCell, twins: twinsOf(openCell).length, twinName: twinName(openCell), all, more, hear, keyChords: keyList,
    keys, sel, notes: notesNow(openCell), ownNotes: !!ownNotes, exact: nearOwn ? nearOwn.exact : true,
    timing: { hits: openHits, own: !!edits[openCell]?.hits, steps: stepsOf(openCell), preset: sameHits(openHits, heldHits(stepsOf(openCell))) ? "held" as const : sameHits(openHits, shortNow) ? "short" as const : null },
    flats: /b|♭/.test(o.keyName) || (scale === "minor" && /^[CDFG]$/.test(o.keyName)) || o.keyName === "F",
  } : null;
  // CS1-1: the chords' closeness follows Mine's chord names: half the sound (Phase 5's measure, knobs and
  // preset), half how well Mine's chords match the notes the part plays per cell (recomputed on every pick).
  const notesScore = useMemo(() => (raw && mineChords ? notesMatch(raw.cellChroma, mineChords.cells.map((_, i) => cellNotes(mineChords, edits, i).map((m) => ((m % 12) + 12) % 12))) : null), [raw, mineChords, edits]);
  const soundClose = mine?.rowCloseness ?? null;
  const rowCloseness = soundClose ? { ...soundClose, chords: soundClose.chords && notesScore !== null ? { ...soundClose.chords, score: Math.round((soundClose.chords.score + notesScore) / 2), sound: soundClose.chords.score, notes: notesScore } : soundClose.chords } : null;
  /** Graders (slice 1): Make's chords as the screen shows them and as Mine plays them; names and numbers only. */
  const chordsDebug = () => {
    if (!guess || !mineChords || !raw) return { readState, cells: null };
    const from = o.fromBar ?? null;
    return {
      readState, reader: raw.chords.reader, readMs: raw.ms, bpm: o.bpm, bars: guess.bars, steps: guess.steps, register: guess.register, fromBar: from,
      open: openCell, openBar: from !== null ? from + guess.cells[openCell].bar : null, all, more, hear, ab, keys, sel, timing: chordsView?.timing ?? null, twins: twinsOf(openCell).length, twinName: twinName(openCell), keyChords: keyList,
      closeness: { score: rowCloseness?.chords?.score ?? null, sound: soundClose?.chords?.score ?? null, notes: notesScore },
      cells: guess.cells.map((g, i) => ({
        cell: i, bar: g.bar + 1, barNo: from !== null ? from + g.bar : null, half: g.steps < 16 ? (g.startStep % 16 === 0 ? 1 : 2) : null, startStep: g.startStep, steps: g.steps,
        guess: g.name, name: mineChords.cells[i].name, edited: edits[i] !== undefined, edit: edits[i] ?? null, notes: cellNotes(mineChords, edits, i), hits: hitsNow(i), planted: plants[i]?.name ?? null, unsure: !!unsure[i] && edits[i] === undefined,
        score: Math.round(g.score * 1000) / 1000, cards: cardsFor(g), alternatives: g.alternatives.map((a) => ({ name: a.name, score: Math.round(a.score * 1000) / 1000 })),
      })),
      played: mineChords.events.map((e) => {
        const c = mineChords.cells[e.cell];
        return { tMs: Math.round(e.t * 10000) / 10, durMs: Math.round(e.dur * 10000) / 10, step: e.step, off: e.off, cell: e.cell, chord: c?.name ?? "", held: e.held, struck: e.struck, vel: e.vel, notes: cellNotes(mineChords, edits, e.cell) };
      }),
    };
  };
  /** Graders (H14): Make's guess on the bar numbered `barNo` (as on its tile) becomes `name`, as if misread; the right one stays among the cards. */
  const plantChord = (barNo: number, name: string, opts: { unsure?: boolean } = {}) => {
    const n = normalChord(name);
    if (!n || !guess || !loopKey) return null;
    const bar = barNo - (o.fromBar ?? 0), i = guess.cells.findIndex((c) => c.bar === bar);
    if (i < 0) return null;
    const was = raw!.chords.cells[i].name;
    setPlants((p) => ({ loopKey, cells: { ...(p.loopKey === loopKey ? p.cells : {}), [i]: { name: n, unsure: !!opts.unsure } } }));
    setEdits((p) => { const next = { ...(p.loopKey === loopKey ? p.edits : {}) }; delete next[i]; return { loopKey, edits: next }; });
    return { cell: i, barNo, was, planted: n };
  };

  const ticks = perRow((r) => (read ? ticksS[r] : null));
  return {
    chords: chordsView, openChord, pickChord, tapCard, tapTrack, setAll, setMore, chordsDebug, plantChord,
    setPiano, toggleNote, hitOp, presetHits, resetCell,
    open, setOpen, rows, sounds, setPreset, setKnob, ticks, suggesting, read, readState, readError: state?.error ?? null, on, anyway, playAnyway, backToOff,
    suggestNow: (row: MelodyRow) => { if (read) void suggest(read, row, sounds[row], ticks[row]?.macros ?? null); },
    suggestedNow: perRow((r) => !!ticks[r] && ticks[r]!.for === soundId(sounds[r].preset, sounds[r].macros)),
    ab, setAb, bed, setBed, mineReady: !!mine && mine.key === mineKeyNow, mineAny: !!mine, rowCloseness,
    /** M-F3: no row is on in Mine (every row off as doubtful): B would play silence. */
    allOff: !!read && !MELODY_ROWS.some((r) => on[r]),
    mySounds, loadSound, name: nameField, setName: (v: string) => setNames((n) => ({ ...n, [open]: v })), tags, save, canSave, savedRows,
    saved: { state: saveState.state, text: saveState.text, savedAs: lastRow && lastRow.sound === sid ? lastRow.name : null, action: action.kind },
    bpm: o.bpm,
    /** K10: the open chord for a Mentor question (names and MIDI only): Mine's name, the owner's own notes, the chords around it, and its bar. */
    labChord: open === "chords" && guess && mineChords && mineChords.cells[openCell]?.name ? {
      name: mineChords.cells[openCell].name,
      ...(edits[openCell]?.notes ? { notes: edits[openCell].notes } : {}),
      // The loop goes round: the first bar's chord before is the last one's.
      prev: mineChords.cells[(openCell - 1 + mineChords.cells.length) % mineChords.cells.length]?.name || null, next: mineChords.cells[(openCell + 1) % mineChords.cells.length]?.name || null,
      barNo: (o.fromBar ?? 1) + guess.cells[openCell].bar,
    } : null,
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
  if (m.readState === "reading" || m.readState === "idle") return "Reading the chords… a second.";
  if (m.readState === "nonotes") return "No chords in this loop. Loop a section where the chords play.";
  return m.readError ?? "Press Play.";
}

/** What the Mentor calls a row's sound ("stabs", "pads", "keys", "plucks", "lead"). */
const nounOf = (id: MelodyPresetId) => (melodyRowOf(id) === "lead" ? "lead" : ({ stab: "stabs", pluck: "plucks", pad: "pads", keys: "keys" } as const)[kindOf(id)]);

export function MelodyMiddle({ m, loop, playing, heardMs, from, onAsk }: { m: MelodyModel; loop: LoopState | null; playing: boolean; heardMs: () => number; from: number | null; onAsk?: (q: string, bar: number) => void }) {
  const steps = m.read?.d.steps ?? (loop ? Math.max(16, Math.round((loop.endMs - loop.startMs) / (60000 / m.bpm / 4))) : 128);
  const bars = Math.max(1, Math.round(steps / 16));
  const wait = waitLine(m, loop, playing), off = !!wait, short = useShort();
  const row = m.open, snd = m.sounds[row], rr = m.read?.d.rows[row], rowOff = !!rr?.doubtful && !m.anyway.includes(row);
  const ticks = m.ticks[row]?.macros;
  let line: React.ReactNode;
  if (rowOff) line = <>{`Mentor: this row is off. ${(rr?.why ?? "").replace(/,? off in Mine$|: off in Mine$/, "")}.`}<br /><span className={s.faintLine}>Mine leaves it out. Press Play anyway to hear it.</span></>;
  else if (m.suggesting === row) line = `Measuring the ${nounOf(snd.preset)} against ${melodyPreset(snd.preset).name}…`;
  else if (!m.read?.targets[row]) line = <span className={s.faintLine}>Not enough clear notes in this row to compare with.</span>;
  else if (!ticks) line = `Mentor: press Suggest for ${MELODY_ROW_NAMES[row].toLowerCase()} to compare this preset with the original.`;
  else line = <>Mentor: {polySuggestLine(snd.preset, snd.macros, ticks, nounOf(snd.preset))}{m.ticks[row]?.moved && polyMoves(snd.macros, ticks).length > 0 ? <><br /><span className={s.faintLine}>{m.ticks[row]!.moved}</span></> : null}</>;
  return (
    <div className={s.drums}>
      <div className={s.drRows} role="group" aria-label="Melody rows">
        {m.rows.map((r) => {
          const x = m.read?.d.rows[r], lit = r === row, doubtful = !!x?.doubtful && !m.anyway.includes(r);
          // Slice 1 (K4): the Chords row is a tile per bar once the chords are read.
          const tiles = r === "chords" && !off && !!m.chords;
          if (tiles) return (
            <div key={r} className={`${s.drRow} ${ch.chordRow}`} data-lit={lit ? "" : undefined}>
              <button className={s.drName} aria-pressed={lit} onClick={() => m.setOpen(r)}>{MELODY_ROW_NAMES[r]}</button>
              <div className={ch.chordTrack}><ChordTiles v={m.chords!} from={from} bars={bars} onOpen={(i) => { m.setOpen("chords"); m.openChord(i); }} /></div>
              <div className={s.drSlot}>{!lit && <span className={s.drPreset}>{melodyPreset(m.sounds[r].preset).name}</span>}{m.savedRows[r] && <span className={s.drSaved}>saved</span>}</div>
            </div>
          );
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
        {loop?.state === "memory" && !off && bars <= 8 && <div className={s.drHeadBox} style={{ top: 0 }}><Playhead heardMs={heardMs} loop={loop} bars={bars} /></div>}
      </div>
      {!off && <ChordPanel m={m} from={from} playing={playing} onAsk={onAsk} />}
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
          <button aria-pressed={m.ab === "b"} onClick={() => m.setAb("b")} disabled={!m.mineAny || m.allOff} title={m.allOff ? "Every row is off: press Play anyway on a row to hear Mine" : m.mineAny ? undefined : "Mine plays once the loop is read"}>B · Mine</button>
        </div>
        {/* M-F3: with every row off there is nothing to hear on B; say why next to it. */}
        <span className={s.faint}>{m.allOff ? "every row is off" : "same loudness"}</span>
      </div>
      <button className={s.ghost} aria-pressed={m.bed} onClick={() => m.setBed(!m.bed)} title="Plays the original drums under both A and B, so you judge the chords in the groove">{m.bed ? "Drums under both: on" : "Drums under both: off"}</button>
      <span className={s.drScore} title={m.open === "chords"
        ? "Half how close the sound is to the original's (spectrum, envelope, room and width: follow the gold ticks), half how well Mine's chords match the notes the track plays in each bar (it moves as you pick chords). Numbers only."
        : "How close this row's notes sound to the original's (the same notes on both sides: their spectrum, envelope, room and width): it rises as you follow this row's gold ticks. Numbers only."}>
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
