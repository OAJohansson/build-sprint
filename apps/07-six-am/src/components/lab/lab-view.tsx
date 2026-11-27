"use client";

// The Lab, Listen mode (S1, jobs 1–2; design lab-handoff.md, decisions L153–L179, T81–T90): the
// arrangement map of a saved track, played as four separated parts. The first Play opens the Deck
// (SoundCloud in a small window) and asks Chrome to share it (L178, L179); after that Play just
// plays. Seek, loop a section from memory (L161), hear only / mute parts (L177), chords estimated
// as you listen. Everything audio lives in LabTransport (src/lib/lab/transport.ts); nothing of the
// original is stored or sent (L143). Graders: window.__sixamLab; ?quiet=1 silences the output.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/studio/logo";
import { SettingsLink, ViewsNav } from "@/components/views-nav";
import type { EarsAnalysis } from "@/lib/ears/results";
import { LiveError, PART_NAMES, type PartName } from "@/lib/lab/live";
import { barToMs, loopBars, msToBar } from "@/lib/lab/timing";
import { LabTransport, type TransportState } from "@/lib/lab/transport";
import { clockMs, labParts, labSections, sectionAt, type LabSection } from "@/lib/lab/view";
import type { TrackMap } from "@/lib/map/types";
import { ApiError, mentorApi, money } from "@/lib/mentor/client";
import { HEARD_WINDOW, chordLines, knowsLine, labContextText, PART_LABEL, type LabAsk } from "@/lib/mentor/lab";
import { chordFacts, chordFactsPlain } from "@/lib/mentor/chord-facts";
import { conventionalKey } from "@/lib/synths/theory";
import { HATS_ROW, KICK_ROW, referenceDb } from "@/lib/lab/activity";
import { measurePart } from "@/lib/lab/measure";
import { HearChip, Lanes, heardParts, type Hear } from "./lanes";
import { LabNotes, type LabTurn } from "./lab-notes";
import { MakeRoom, useMake, type Family, type MakeModel } from "./make-room";
import { asMakeRow, useDrums, type DrumsModel } from "./make-drums";
import { MAKE_ROWS, type MakeRow } from "@/lib/make/drums-make";
import type { HitKind } from "@/lib/make/drum-edit";
import { useMelody, type MelodyModel } from "./make-melody";
import { MELODY_ON } from "@/lib/make/melody-reader";
import { MakeClient } from "@/lib/make/make-client";
import { chordsReport, type ChordsReader, type ChordsReport } from "@/lib/make/chords-read";
import { useFx, type FxModel } from "./make-fx";
import type { FxKnobId, FxPresetId, FxRow } from "@/lib/make/fx-synth";
import type { MelodyPresetId, MelodyRow, PolyKnobId } from "@/lib/make/poly-synth";
import type { DrumKnobId, DrumRow, DrumSoundId } from "@/lib/make/drum-synth";
import type { MacroId, MakePresetId } from "@/lib/make/presets";
import s from "./lab.module.css";

/** Phase 7 (R8c, L273f): what Make plays, for graders: the picked sound per row, each row's pattern, the play position (names and numbers only). */
export type SixamMakeHook = {
  family: () => Family;
  picked: () => { drums: ReturnType<DrumsModel["debug"]>["picked"] | null; bass: { id: MakePresetId; name: string; family: string; feel: string; loaded: boolean; macros: Record<string, number> } | null; open: MakeRow | null };
  /** Phase 7 slice 2: the six rows as played (read and added hits; `hits` is what plays and saves). */
  patterns: () => { steps: number | null; bars: number | null; drums: Record<MakeRow, { step: number; off: number; vel: number; kind: HitKind }[]> | null; doubtful: Record<MakeRow, boolean> | null; on: Record<MakeRow, boolean> | null; bass: { bars: number; notes: { step: number; midi: number; dur: number; vel: number }[] } | null };
  /** `step`: the drum grid's 16th now (the grid's step 0 sits gridMs after the loop's start); `jump`: the last click-to-jump (R5, W8). */
  position: () => { ms: number; bar: number; playing: boolean; ab: { drums: "a" | "b"; bass: "a" | "b" }; loop: { startMs: number; endMs: number; state: string } | null; loopFraction: number | null; step: number | null;
    /** `startErrMs`: where play started against the clicked spot (ms; heard 150 ms after the click, less those 150 ms). */
    jump: { targetMs: number; family: string; at: number; startErrMs: number | null } | null };
  /** Slice 2 (R3, R3b, R4): each row's marks (read / added / removed), mute, solo, heard, its fill-by-ear state; the rows still open; the hats reader (W5). */
  rows: () => { rows: ReturnType<DrumsModel["debug"]>["rows"]; openRows: MakeRow[]; earRows: MakeRow[]; openHatsRead: boolean; hats: ReturnType<DrumsModel["debug"]>["hats"]; wouldSave: ReturnType<DrumsModel["debug"]>["wouldSave"] } | null;
  /** As a tap on a step (bar `step` / 16), a Mute or Solo button, "Leave empty" / "Undo", a row name. */
  tapStep: (row: MakeRow | "hats", step: number) => void;
  mute: (row: MakeRow | "hats") => void;
  solo: (row: MakeRow | "hats") => void;
  leaveEmpty: (row: MakeRow | "hats", on: boolean) => void;
  open: (row: MakeRow | "hats") => void;
  /** As a click on the loop's ruler: plays from `ms` (track time), as Make's bar ruler does. */
  jump: (ms: number) => void;
  /** L272's flag, for graders: read the loop again with Open hat read (true) or left to fill by ear (false). */
  readOpenHats: (on: boolean) => void;
  /** The last tap on a shelf: which sound, and ms from the tap until it played (null until it has). */
  taps: () => { drums: { id: string; heardMs: number | null } | null; bass: { id: string; heardMs: number | null } | null };
  /** As a tap: pick a sound on a row ("bass" for the bass), turn a knob, show or hide the shelf. */
  pick: (row: MakeRow | "hats" | "bass", id: string) => void;
  knob: (row: MakeRow | "hats" | "bass", id: string, v: number) => void;
  shelf: (on: boolean) => void;
};

declare global {
  interface Window { __sixamMake?: SixamMakeHook; __sixamLab?: { state: () => TransportState | null; heardMs: () => number; bar: () => number; hear: () => Hear; levels: () => number[]; barLevels: () => (number | null)[][]; mineLevel: () => number; make: () => ReturnType<MakeModel["debug"]> | null; setLoop: (startMs: number, endMs: number) => void; weight: () => ReturnType<LabTransport["weight"]>; capture: (onsets: number[]) => ReturnType<LabTransport["capture"]>;
    /** Phase 5 graders: the Make family, the drums' state and actions, A/B levels and the drums closeness (numbers only). */
    family: () => Family; setFamily: (f: Exclude<Family, "vocals">) => void; drums: () => ReturnType<DrumsModel["debug"]> | null;
    drumsDo: { open: (row: MakeRow | DrumRow) => void; preset: (row: MakeRow | DrumRow, id: DrumSoundId) => void; knob: (row: MakeRow | DrumRow, id: DrumKnobId, v: number) => void; suggest: (row: MakeRow | DrumRow) => void; ab: (x: "a" | "b") => void; bed: (on: boolean) => void; playAnyway: (row: MakeRow | DrumRow) => void; save: (row: MakeRow | DrumRow, name?: string) => Promise<void> };
    compareLevels: (part: number) => ReturnType<LabTransport["compareLevels"]>; captureDrums: () => ReturnType<LabTransport["captureDrums"]>;
    /** Slice 2 graders: the melody's state and actions (numbers only); unset while MELODY_ON is off (L247). */
    melody?: () => ReturnType<MelodyModel["debug"]> | null;
    /** Slice 3 graders: the FX state and actions (numbers only). */
    fx: () => ReturnType<FxModel["debug"]> | null;
    fxDo: { open: (row: FxRow) => void; preset: (row: FxRow, id: FxPresetId) => void; knob: (row: FxRow, id: FxKnobId, v: number) => void; ab: (x: "a" | "b") => void; bed: (on: boolean) => void; save: (row: FxRow, name?: string) => Promise<void> };
    /** Phase 6 spike graders: read the looped "other" part (in memory) with chord reader A ("dsp") or B ("basic-pitch"); numbers and names only. Null before the loop is in memory. */
    chordsRead: (reader?: ChordsReader) => Promise<(ChordsReport & { loop: { startMs: number; endMs: number }; levelDb: number; lufs: number }) | null>;
    /** Phase 6 slice 1 graders: Make's chords as shown and played (cells, guesses, cards, picks, played events with their notes); names and numbers only. */
    makeChords?: () => ReturnType<MelodyModel["chordsDebug"]> | null;
    /** Phase 6 slice 1 graders: the listening panel's actions, as a tap would do them (open a cell, pick a card, the Track button, the switches). */
    chordsDo?: { open: (cell: number) => void; pick: (name: string, opts?: { all?: boolean; cell?: number; hear?: boolean }) => boolean; track: () => void; all: (on: boolean) => void; more: (on: boolean) => void;
      /** Slice 2 (K5, K6): the open cell on the keys; a note in or out; the timing strip (select a hit by index, add one on a 16th, move the selected one); the presets; ↺ Reset. */
      piano: (on: boolean) => void; toggleNote: (midi: number) => { notes: number[]; name: string | null; exact: boolean } | null;
      hit: (op: "select" | "add" | "earlier" | "later" | "shorter" | "longer" | "remove" | "to", at?: number) => boolean; preset: (p: "held" | "short") => void; reset: () => void };
    /** Dev/grader only (H14): Make's guess on the bar numbered `bar` (as on its tile) becomes `name`, as if misread. */
    /** Phase 6 slice 3 graders (H12): the open chord's theory facts and the exact Lab-facts block the server puts in the prompt for a question at its bar (no model call). */
    chordFacts?: () => { bar: number; chord: LabAsk["chord"]; facts: ReturnType<typeof chordFacts>; theory: string[]; labFacts: string; offline: string | null } | null;
    /** Phase 6 slice 4 (K7): the lead as read and as Mine plays it (reader, doubtful/off, per-bar grids, played notes, closeness). */
    makeLead?: () => ReturnType<MelodyModel["leadDebug"]> | null;
    /** K7: the lead grid's actions. open/close a bar (index in the loop, 0-based), place a note (MIDI, 16th 0–15), select one (index), shorter/longer/remove the selected, reset the bar, the outside switch. */
    leadDo?: { open: (bar: number) => void; close: () => void; place: (midi: number, at: number) => boolean; select: (k: number | null) => void; shorter: () => boolean; longer: () => boolean; remove: () => boolean; reset: () => void; outside: (on: boolean) => void };
    /** Dev/grader only: a planted misread note in the read lead, on the bar numbered `bar` (as on the tiles), at 16th `at`. */
    plantLeadNote?: (bar: number, at: number, midi: number) => { bar: number; notes: { at: number; len: number; midi: number }[] } | null;
    plantChord?: (bar: number, name: string, opts?: { unsure?: boolean }) => { cell: number; barNo: number; was: string; planted: string } | null;
    melodyDo?: { open: (row: MelodyRow) => void; preset: (row: MelodyRow, id: MelodyPresetId) => void; knob: (row: MelodyRow, id: PolyKnobId, v: number) => void; suggest: (row: MelodyRow) => void; ab: (x: "a" | "b") => void; bed: (on: boolean) => void; playAnyway: (row: MelodyRow) => void; backToOff: (row: MelodyRow) => void; save: (row: MelodyRow, name?: string) => Promise<void> } } }
}

type Mode = "listen" | "make";
const plantOn = () => { if (process.env.NODE_ENV !== "production") return true; try { return new URLSearchParams(location.search).get("plant") === "1"; } catch { return false; } };
/** Where you were in this track, for a reload (LS1-8): a position only, per tab. */
const POS_KEY = (id: string) => `07-six-am:lab-pos:${id}`;
/** Phase 5: the Make family a focus part belongs to (the switch sets the focus; FX has no part of its own). */
const familyOf = (p: PartName): Family => (p === "bass" ? "bass" : p === "drums" ? "drums" : p === "other" ? "melody" : "vocals");
const FAMILY_PART: Record<"bass" | "drums" | "melody", PartName> = { bass: "bass", drums: "drums", melody: "other" };
const FIRST_LINE = "To split the parts, Six AM plays the song again from SoundCloud in a small window. It never keeps the audio.";

function problemText(e: unknown): string {
  if (e instanceof LiveError) {
    if (e.reason === "cancelled") return "Chrome didn't share the Deck. Press Play and pick “Six AM Deck” in Chrome's dialog.";
    if (e.reason === "hidden") return "Come back to this tab, then press Play.";
    return e.message;
  }
  return `The part splitter couldn't start: ${e instanceof Error ? e.message : String(e)}`;
}

export function LabView({ map, analysis, code, quiet }: { map: TrackMap; analysis: EarsAnalysis | null; code: string; quiet: boolean }) {
  const parts = useMemo(() => labParts(map), [map]);
  const sections = useMemo(() => labSections(map), [map]);
  const bars = map.bars;
  const bpm = map.bpm, origin = map.originSec;
  const tr = useRef<LabTransport | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [ts, setTs] = useState<TransportState | null>(null);
  const [chords, setChords] = useState<(string | null)[]>(() => map.chords ?? Array.from({ length: Math.ceil(bars / 8) }, () => null));
  const [levels, setLevels] = useState<(number | null)[][] | null>(() => map.partLevels ?? null);
  const [hear, setHear] = useState<Hear>({ kind: "all" });
  const [focus, setFocus] = useState<PartName>(() => {
    // Phase 5: ?make=drums opens Make on the drums (graders, links).
    const f = typeof location !== "undefined" ? new URLSearchParams(location.search).get("make") : null;
    return f === "drums" ? "drums" : f === "melody" ? "other" : "bass";
  }); // T87: the last part heard "only"
  const [fxPicked, setFxPicked] = useState(() => typeof location !== "undefined" && new URLSearchParams(location.search).get("make") === "fx");
  const family: Family = fxPicked ? "fx" : familyOf(focus);
  const familyRef = useRef(family);
  useEffect(() => { familyRef.current = family; }, [family]);
  const [mode, setMode] = useState<Mode>(() => (typeof location !== "undefined" && new URLSearchParams(location.search).get("mode") === "make" ? "make" : "listen"));
  const [problem, setProblem] = useState<string | null>(null);
  const [pos, setPos] = useState({ sec: 0, bar: 1 });
  // S2: the Mentor's notes on this track (every part), the open dot and a new question's bar.
  const [turns, setTurns] = useState<(LabTurn & { part: PartName })[]>([]);
  const [openBar, setOpenBar] = useState<number | null>(null);
  const [asking, setAsking] = useState<number | null>(null);
  const [usageNote, setUsageNote] = useState<string | null>(null);
  const hearRef = useRef(hear);
  useEffect(() => { hearRef.current = hear; }, [hear]);
  const makeRef = useRef<MakeModel | null>(null);
  const drumsRef = useRef<DrumsModel | null>(null);
  // R5 (W8): the last click-to-jump in Make, for the dev hook.
  const jumpRef = useRef<{ targetMs: number; family: string; at: number; startErrMs: number | null } | null>(null);
  const onJumpRef = useRef<(ms: number) => void>(() => {});
  const melodyRef = useRef<MelodyModel | null>(null);
  const labAskRef = useRef<((bar: number) => LabAsk) | null>(null);
  const fxRef = useRef<FxModel | null>(null);
  // Phase 6 spike: the track's key for the chord readers' key bias (grader hook only).
  const keyRef = useRef<{ key: string; scale: "major" | "minor" } | undefined>(undefined);
  useEffect(() => {
    const k = map.key || analysis?.key || "", sc = map.scale || analysis?.scale || "";
    keyRef.current = k && (sc === "major" || sc === "minor") ? { key: k, scale: sc } : undefined;
  });
  const onFamily = useCallback((f: Exclude<Family, "vocals">) => {
    setFxPicked(f === "fx");
    // FX-F1: FX live in the "other" part: a question asked in FX is about that, not the last part heard.
    setFocus(f === "fx" ? "other" : FAMILY_PART[f]);
    const url = new URL(location.href);
    url.searchParams.set("make", f);
    history.replaceState(null, "", url);
  }, []);
  const onFamilyRef = useRef(onFamily);

  // One transport per page: the Deck link, the separator and the loop's memory. Gone on leave.
  useEffect(() => {
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    // Chord names and part levels (numbers only, L181, LS1-N1) go onto the saved map together, a
    // few seconds after they change.
    const saved = { chords: map.chords, partLevels: map.partLevels };
    const save = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { mentorApi(code).putMap({ ...map, ...saved }).catch(() => {}); }, 8000);
    };
    const t = new LabTransport({
      url: map.id, bpm, originSec: origin, bars, durationMs: map.durationSec * 1000, knownChords: map.chords, knownLevels: map.partLevels, quiet, deckPath: "/deck",
      onChange: setTs,
      onChords: (cells) => { setChords(cells); saved.chords = cells; save(); },
      onLevels: (lv) => { setLevels(lv); saved.partLevels = lv; save(); },
    });
    tr.current = t;
    try { const saved = Number(sessionStorage.getItem(POS_KEY(map.id))); if (saved > 0) t.seek(saved); } catch { /* storage blocked */ }
    let raf = 0, lastSec = -1, lastBar = -1;
    const frame = () => {
      const ms = t.heardMs();
      const b = Math.min(bars + 0.999, Math.max(1, msToBar(ms, bpm, origin)));
      grid.current?.style.setProperty("--ph", `${((b - 1) / bars) * 100}%`);
      const sec = Math.floor(ms / 1000), bi = Math.floor(b);
      if (sec !== lastSec || bi !== lastBar) {
        lastSec = sec; lastBar = bi; setPos({ sec, bar: bi });
        try { sessionStorage.setItem(POS_KEY(map.id), String(Math.round(ms))); } catch { /* storage blocked */ }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // Phase 6 spike: the chord readers' own worker, made on a grader's first call only (shortcut: a
    // grader-only hook with its own two workers; slice 1 moves the read into Make's Melody tab).
    let spike: MakeClient | null = null;
    const chordsRead = async (reader: ChordsReader = "dsp") => {
      const held = t.loopPart(2);
      if (!held) return null;
      // C2: copies of the in-memory loop go to the worker, which zeroes them; only numbers come back.
      const res = await (spike ??= new MakeClient()).chordsRead({ left: held.left.slice(), right: held.right.slice(), rate: held.rate, bpm, key: keyRef.current, reader });
      console.info(`[make] chords read (${res.reader}) in ${res.ms} ms: ${res.chords.cells.map((c) => c.name || "-").join(" ")}, ${res.chords.events.length} chords, lead ${res.lead.notes.length} notes (${res.lead.from})`);
      return { ...chordsReport(res.chords, res.lead, res.ms), loop: { startMs: held.startMs, endMs: held.endMs }, levelDb: Math.round(res.levelDb * 100) / 100, lufs: Math.round(res.lufs * 100) / 100 };
    };
    window.__sixamLab = { state: () => tr.current?.state ?? null, heardMs: () => t.heardMs(), bar: () => msToBar(t.heardMs(), bpm, origin), hear: () => hearRef.current, levels: () => t.partLevels(), barLevels: () => t.levels(), mineLevel: () => t.mineLevel(), make: () => makeRef.current?.debug() ?? null, setLoop: (startMs: number, endMs: number) => t.setLoop({ startMs, endMs }), weight: () => t.weight(), capture: (onsets: number[]) => t.capture(onsets),
      family: () => familyRef.current, setFamily: (f) => onFamilyRef.current(f), drums: () => drumsRef.current?.debug() ?? null,
      drumsDo: {
        open: (row) => drumsRef.current?.setOpen(asMakeRow(row)), preset: (row, id) => drumsRef.current?.setPreset(asMakeRow(row), id), knob: (row, id, v) => drumsRef.current?.setKnob(asMakeRow(row), id, v),
        suggest: (row) => drumsRef.current?.suggestNow(asMakeRow(row)), ab: (x) => drumsRef.current?.setAb(x), bed: (on) => drumsRef.current?.setBed(on),
        playAnyway: (row) => drumsRef.current?.playAnyway(asMakeRow(row)), save: async (row, name) => { await drumsRef.current?.save(asMakeRow(row), name); },
      },
      compareLevels: (part: number) => t.compareLevels(part), captureDrums: () => t.captureDrums(),
      // L247: Melody is off this phase, so its grader hooks are not set.
      ...(MELODY_ON ? {
        melody: () => melodyRef.current?.debug() ?? null,
        makeChords: () => melodyRef.current?.chordsDebug() ?? null,
        makeLead: () => melodyRef.current?.leadDebug() ?? null,
        leadDo: {
          open: (bar: number) => melodyRef.current?.openLead(bar), close: () => melodyRef.current?.closeLead(),
          place: (midi: number, at: number) => melodyRef.current?.placeLead(midi, at) ?? false, select: (k: number | null) => melodyRef.current?.selectLead(k),
          shorter: () => melodyRef.current?.stretchLead(-1) ?? false, longer: () => melodyRef.current?.stretchLead(1) ?? false, remove: () => melodyRef.current?.removeLead() ?? false,
          reset: () => melodyRef.current?.resetLead(), outside: (on: boolean) => melodyRef.current?.setOutside(on),
        },
        chordFacts: () => {
          const lc = melodyRef.current?.labChord, ask = lc ? labAskRef.current?.(lc.barNo) : null;
          if (!lc || !ask?.chord) return null;
          const ks = { key: map.key || "", scale: map.scale || "" };
          const facts = ks.scale === "major" || ks.scale === "minor" ? chordFacts({ key: ks.key, scale: ks.scale, chord: ask.chord.name, notes: ask.chord.notes, prev: ask.chord.prev, next: ask.chord.next }) : null;
          return { bar: lc.barNo, chord: ask.chord, facts, theory: chordLines(ask.chord, ks, lc.barNo), labFacts: labContextText(ask, map), offline: facts ? chordFactsPlain(facts) : null };
        },
        chordsDo: {
          open: (cell: number) => melodyRef.current?.openChord(cell), pick: (name: string, opts?: { all?: boolean; cell?: number; hear?: boolean }) => melodyRef.current?.pickChord(name, opts) ?? false,
          track: () => melodyRef.current?.tapTrack(tr.current?.playing ?? false), all: (on: boolean) => melodyRef.current?.setAll(on), more: (on: boolean) => melodyRef.current?.setMore(on),
          piano: (on: boolean) => melodyRef.current?.setPiano(on), toggleNote: (midi: number) => melodyRef.current?.toggleNote(midi) ?? null,
          hit: (op: "select" | "add" | "earlier" | "later" | "shorter" | "longer" | "remove" | "to", at?: number) => melodyRef.current?.hitOp(op, at) ?? false,
          preset: (p: "held" | "short") => melodyRef.current?.presetHits(p), reset: () => melodyRef.current?.resetCell(),
        },
      } : {}),
      // H14: dev builds, or a production build opened with ?plant=1 (graders run production on :3017). It only
      // changes Make's guess in memory, never saved data.
      ...(MELODY_ON && plantOn() ? {
        plantChord: (bar: number, name: string, opts?: { unsure?: boolean }) => melodyRef.current?.plantChord(bar, name, opts) ?? null,
        plantLeadNote: (bar: number, at: number, midi: number) => melodyRef.current?.plantLeadNote(bar, at, midi) ?? null,
      } : {}),
      fx: () => fxRef.current?.debug() ?? null,
      chordsRead,
      fxDo: {
        open: (row) => fxRef.current?.setOpen(row), preset: (row, id) => fxRef.current?.setPreset(row, id), knob: (row, id, v) => fxRef.current?.setKnob(row, id, v),
        ab: (x) => fxRef.current?.setAb(x), bed: (on) => fxRef.current?.setBed(on), save: async (row, name) => { await fxRef.current?.save(row, name); },
      },
      ...(MELODY_ON ? { melodyDo: {
        open: (row: MelodyRow) => melodyRef.current?.setOpen(row), preset: (row: MelodyRow, id: MelodyPresetId) => melodyRef.current?.setPreset(row, id), knob: (row: MelodyRow, id: PolyKnobId, v: number) => melodyRef.current?.setKnob(row, id, v),
        suggest: (row: MelodyRow) => melodyRef.current?.suggestNow(row), ab: (x: "a" | "b") => melodyRef.current?.setAb(x), bed: (on: boolean) => melodyRef.current?.setBed(on),
        playAnyway: (row: MelodyRow) => melodyRef.current?.playAnyway(row), backToOff: (row: MelodyRow) => melodyRef.current?.backToOff(row), save: async (row: MelodyRow, name?: string) => { await melodyRef.current?.save(row, name); },
      } } : {}) };
    // Phase 7 (R8c): Make's own grader hook.
    const loopNow = () => { const l = tr.current?.state.loop; return l ? { startMs: l.startMs, endMs: l.endMs, state: l.state } : null; };
    window.__sixamMake = {
      family: () => familyRef.current,
      picked: () => {
        const d = drumsRef.current?.debug(), b = makeRef.current?.debug();
        return { drums: d?.picked ?? null, open: d?.open ?? null, bass: b ? { id: b.preset, name: b.name, family: b.family, feel: b.feel, loaded: b.loaded, macros: b.macros } : null };
      },
      patterns: () => {
        const d = drumsRef.current?.debug(), b = makeRef.current?.debug();
        const rows = d?.rows ?? null;
        return {
          steps: d?.steps ?? null, bars: d?.steps ? Math.round(d.steps / 16) : null,
          drums: rows ? Object.fromEntries(MAKE_ROWS.map((r) => [r, rows[r].hits.map((h) => ({ step: h.step, off: h.off, vel: h.vel, kind: h.kind }))])) as Record<MakeRow, { step: number; off: number; vel: number; kind: HitKind }[]> : null,
          doubtful: rows ? Object.fromEntries(MAKE_ROWS.map((r) => [r, rows[r].doubtful])) as Record<MakeRow, boolean> : null,
          on: d?.on ?? null,
          bass: b?.pattern ? { bars: b.pattern.bars, notes: b.pattern.notes.map((n) => ({ step: n.step, midi: n.midi, dur: n.dur, vel: n.vel })) } : null,
        };
      },
      position: () => {
        const ms = t.heardMs(), l = loopNow(), dd = drumsRef.current?.debug(), steps = dd?.steps ?? null, gridMs = dd?.gridMs ?? 0;
        const f = l ? (ms - l.startMs) / (l.endMs - l.startMs) : null, inside = f !== null && f >= 0 && f < 1;
        const spsMs = 60000 / bpm / 4, j = jumpRef.current;
        return { ms: Math.round(ms), bar: Math.round(msToBar(ms, bpm, origin) * 1000) / 1000, playing: !!tr.current?.state.playing, ab: { drums: drumsRef.current?.ab ?? "a", bass: makeRef.current?.ab ?? "a" }, loop: l, loopFraction: inside ? Math.round(f! * 10000) / 10000 : null,
          step: inside && steps ? ((Math.floor((ms - l!.startMs - gridMs) / spsMs) % steps) + steps) % steps : null,
          jump: j ? { targetMs: Math.round(j.targetMs), family: j.family, at: j.at, startErrMs: j.startErrMs === null ? null : Math.round(j.startErrMs) } : null };
      },
      taps: () => {
        const d = drumsRef.current?.debug().tap ?? null, b = makeRef.current?.debug().tap ?? null;
        return { drums: d ? { id: d.id, heardMs: d.heardMs } : null, bass: b ? { id: b.id, heardMs: b.heardMs } : null };
      },
      pick: (row, id) => {
        const playing = !!tr.current?.state.playing;
        if (row === "bass") makeRef.current?.pick(id as MakePresetId, playing); else drumsRef.current?.pick(asMakeRow(row), id as DrumSoundId, playing);
      },
      knob: (row, id, v) => { if (row === "bass") makeRef.current?.setMacro(id as MacroId, v); else drumsRef.current?.setKnob(asMakeRow(row), id as DrumKnobId, v); },
      rows: () => {
        const d = drumsRef.current?.debug();
        return d ? { rows: d.rows, openRows: d.openRows, earRows: d.earRows, openHatsRead: d.openHatsRead, hats: d.hats, wouldSave: d.wouldSave } : null;
      },
      tapStep: (row, step) => drumsRef.current?.tapStep(asMakeRow(row), step),
      mute: (row) => drumsRef.current?.toggleMute(asMakeRow(row)),
      solo: (row) => drumsRef.current?.toggleSolo(asMakeRow(row)),
      leaveEmpty: (row, on) => drumsRef.current?.leaveEmpty(asMakeRow(row), on),
      open: (row) => drumsRef.current?.setOpen(asMakeRow(row)),
      jump: (ms) => onJumpRef.current(ms),
      readOpenHats: (on) => drumsRef.current?.setReadOpen(on),
      shelf: (on) => { drumsRef.current?.setShelf(on); makeRef.current?.setShelf(on); },
    };
    return () => { cancelAnimationFrame(raf); clearTimeout(saveTimer); spike?.stop(); t.dispose(); tr.current = null; };
  }, [map, bpm, origin, bars, code, quiet]);

  // S3 Make: the same transport, the same loop; Make's own state survives the switch (T87).
  const title = analysis?.title || map.title || "Untitled";
  const make = useMake({
    // Phase 5: the bass's Make runs only while the bass is the family (Mine is one buffer).
    tr, active: mode === "make" && family === "bass", focus, loop: ts?.loop ?? null, bpm, code, title, url: map.id,
    keyName: map.key || analysis?.key || "", scale: map.scale || analysis?.scale || "",
  });
  useEffect(() => { makeRef.current = make; });
  const drums = useDrums({
    tr, active: mode === "make" && family === "drums", loop: ts?.loop ?? null, bpm, code, title, url: map.id,
    keyName: map.key || analysis?.key || "", scale: map.scale || analysis?.scale || "",
  });
  const loopBarsNow = ts?.loop ? { from: Math.round(msToBar(ts.loop.startMs, bpm, origin)), bars: Math.max(1, Math.round(msToBar(ts.loop.endMs, bpm, origin)) - Math.round(msToBar(ts.loop.startMs, bpm, origin))) } : null;
  const melody = useMelody({
    tr, active: MELODY_ON && mode === "make" && family === "melody", loop: ts?.loop ?? null, bpm, code, title, url: map.id,
    keyName: map.key || analysis?.key || "", scale: map.scale || analysis?.scale || "", fromBar: loopBarsNow?.from ?? null,
  });
  const sectionStarts = useMemo(() => sections.map((x) => x.from), [sections]);
  const fx = useFx({
    tr, active: mode === "make" && family === "fx", loop: ts?.loop ?? null, bpm, code, title, url: map.id,
    keyName: map.key || analysis?.key || "", scale: map.scale || analysis?.scale || "",
    from: loopBarsNow?.from ?? null, loopBars: loopBarsNow?.bars ?? null, sectionStarts,
  });
  useEffect(() => { drumsRef.current = drums; melodyRef.current = melody; fxRef.current = fx; onFamilyRef.current = onFamily; });

  // What you hear → the part gains (again once the parts start playing). Make plays the focus part
  // alone (A) or Mine (B), with its own A/B, the drums under both when on (L213); the Hear bar is
  // Listen only (T87).
  const phase = ts?.phase;
  // Phase 5 drums (P7): A the original drums, B Mine's three rows, the original bass under both.
  const bassOn = family === "bass" && make.isBass;
  const mineOn = mode === "make" && ((bassOn && make.ab === "b" && make.mineReady) || (family === "drums" && drums.ab === "b" && drums.mineAny && !drums.allOff) || (MELODY_ON && family === "melody" && melody.ab === "b" && melody.mineAny && !melody.allOff) || (family === "fx" && fx.ab === "b" && fx.mineAny));
  useEffect(() => {
    const t = tr.current;
    if (!t) return;
    if (mode === "make" && family === "drums") t.setParts(PART_NAMES.map((id) => (!mineOn && id === "drums") || (drums.bed && id === "bass")));
    // Slice 2 (P7): A the original "other" part, B Mine's rows, the original drums under both.
    else if (MELODY_ON && mode === "make" && family === "melody") t.setParts(PART_NAMES.map((id) => (!mineOn && id === "other") || (melody.bed && id === "drums")));
    // Slice 3 (P7): A the drop as is (its parts, the drums when the bed is on); B the same with Mine's FX
    // on top, the parts turned down with the FX so B is as loud as A.
    else if (mode === "make" && family === "fx") t.setParts(PART_NAMES.map((id) => id !== "drums" || fx.bed), mineOn ? Math.pow(10, fx.partsDb / 20) : 1);
    else if (mode === "make") t.setParts(PART_NAMES.map((id) => (!mineOn && id === focus) || (bassOn && make.drums && id === "drums")));
    else t.setParts(heardParts(hear, [...PART_NAMES]));
    t.setMineOn(mineOn);
  }, [hear, phase, mode, focus, family, mineOn, bassOn, make.drums, drums.bed, melody.bed, fx.bed, fx.partsDb]);

  const onPlay = useCallback(() => {
    const t = tr.current;
    if (!t) return;
    const st = t.state;
    if (st.phase === "ready") { if (st.playing) t.pause(); else t.play(); return; }
    if (st.phase === "starting") return;
    setProblem(null);
    t.openDeckAndListen().catch((e) => setProblem(problemText(e)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== " " || e.repeat || el.closest("button, input, textarea, select, [role=slider]")) return;
      e.preventDefault();
      onPlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPlay]);

  const onOnly = useCallback((id: PartName) => {
    const cur = hear.kind === "only" ? hear.parts : [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setHear(next.length ? { kind: "only", parts: next } : { kind: "all" });
    if (!cur.includes(id)) { setFocus(id); setFxPicked(false); } // the focus part is the last part heard "only" (T87)
    if (!cur.includes(id) && id !== focus) { setOpenBar(null); setAsking(null); } // its own dots: close the card
  }, [hear, focus]);
  const onMute = useCallback((id: PartName) => {
    setHear((h) => {
      const cur = h.kind === "mute" ? h.parts : [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return next.length ? { kind: "mute", parts: next } : { kind: "all" };
    });
  }, []);
  const onSeek = useCallback((bar: number) => { tr.current?.seek(barToMs(bar, bpm, origin)); }, [bpm, origin]);
  /** R5 (OR6-5): a click on Make's bar ruler plays from that spot (in the loop at once; starts playing if paused). */
  const onJump = useCallback((ms: number) => {
    const t = tr.current;
    if (!t) return;
    t.seek(ms);
    if (t.state.phase === "ready" && !t.playing) t.play();
    const j = { targetMs: ms, family: familyRef.current, at: Date.now(), startErrMs: null as number | null };
    jumpRef.current = j;
    setTimeout(() => { if (jumpRef.current === j && tr.current?.playing) j.startErrMs = tr.current.heardMs() - 150 - ms; }, 150);
  }, []);
  useEffect(() => { onJumpRef.current = onJump; }, [onJump]);

  const loop = ts?.loop ? { from: Math.round(msToBar(ts.loop.startMs, bpm, origin)), to: Math.round(msToBar(ts.loop.endMs, bpm, origin)) } : null;
  const onLoop = useCallback((x: LabSection) => {
    const t = tr.current;
    if (!t) return;
    const l = t.state.loop;
    const from = l ? Math.round(msToBar(l.startMs, bpm, origin)) : null;
    if (from !== null && from >= x.from && from < x.to) { t.setLoop(null); return; } // the same section again: stop
    const r = loopBars({ from: x.from, to: x.to }, msToBar(t.heardMs(), bpm, origin));
    t.setLoop({ startMs: barToMs(r.from, bpm, origin), endMs: barToMs(r.to, bpm, origin) });
  }, [bpm, origin]);

  // The track's notes, once (they live in the Mentor's store, so they survive a reload).
  useEffect(() => {
    if (!code) return;
    let live = true;
    mentorApi(code).labNotes(map.id).then((ns) => {
      if (live) setTurns(ns.map((n) => ({ id: n.id, part: n.part, bar: n.bar, q: n.q, answer: n.answer, facts: n.facts, createdAt: n.createdAt })));
    }, () => { /* no notes shown; asking still says what's wrong */ });
    return () => { live = false; };
  }, [code, map.id]);

  /** What the Lab knows right now, for one question (L156): never audio, only these numbers. */
  const labAsk = useCallback((bar: number): LabAsk => {
    const t = tr.current;
    const l = t?.state.loop ?? null;
    const loopB = l ? { from: Math.round(msToBar(l.startMs, bpm, origin)), to: Math.round(msToBar(l.endMs, bpm, origin)) } : null;
    const held = loopB && t ? t.loopPart(PART_NAMES.indexOf(focus)) : null;
    // FX-F1: in FX the answer starts from the open row (makeRow), not from a part's notes.
    const measure = held && loopB && !(mode === "make" && family === "fx") ? measurePart(focus, held, loopB, bpm, map.key || analysis?.key || "", map.scale || analysis?.scale || "") : null;
    // LS2-M3: what the Lab heard of the focus part around the bar (levels only), drums with its bands.
    const rows = t?.levels() ?? null;
    const from = Math.max(1, bar - HEARD_WINDOW), to = Math.min(bars, bar + HEARD_WINDOW);
    const win = (row: (number | null)[] | undefined) => row && row.some((v) => v !== null) ? { from, levels: row.slice(from - 1, to), refDb: referenceDb(row) } : undefined;
    const part = win(rows?.[PART_NAMES.indexOf(focus)]);
    const kick = focus === "drums" ? win(rows?.[KICK_ROW]) : undefined, hats = focus === "drums" ? win(rows?.[HATS_ROW]) : undefined;
    const heard = part ? { part, ...(kick && hats ? { kick, hats } : {}) } : null;
    const inMake = mode === "make" && family === "bass" ? make.labMake : null;
    // Phase 5: a question asked in Drums, Melody or FX knows the open row, its preset, knobs and ticks.
    const inRow = mode === "make" ? (family === "drums" ? drums.labRow : MELODY_ON && family === "melody" ? melody.labRow : family === "fx" ? fx.labRow : null) : null;
    const heardNow: LabAsk["hear"] = mode === "make" ? { kind: "only", parts: [focus] } : hear;
    // K10: with a bar open in Make's Chords, its chord goes with the question (names and MIDI only, C2).
    const lc = mode === "make" && MELODY_ON && family === "melody" ? melody.labChord : null;
    const inChord = lc ? { name: lc.name, ...(lc.notes ? { notes: lc.notes } : {}), prev: lc.prev, next: lc.next } : null;
    return { part: focus, hear: heardNow, bar, playheadBar: pos.bar, loop: loopB, chords, measure, heard, ...(inMake ? { make: inMake } : {}), ...(inRow ? { makeRow: inRow } : {}), ...(inChord ? { chord: inChord } : {}) };
  }, [focus, hear, pos.bar, chords, bpm, origin, bars, map.key, map.scale, analysis, mode, make.labMake, family, drums.labRow, melody.labRow, melody.labChord, fx.labRow]);

  const keyScale = useMemo(() => ({ key: map.key || analysis?.key || "", scale: map.scale || analysis?.scale || "" }), [map.key, map.scale, analysis?.key, analysis?.scale]);
  useEffect(() => { labAskRef.current = labAsk; });
  const send = useCallback(async (id: string, q: string, bar: number, lab: LabAsk) => {
    try {
      const r = await mentorApi(code).ask({ job: "lab", track: analysis, message: q, lab });
      console.info(`[mentor] lab: ${r.latencyMs} ms at Claude, est. $${r.message.costUsd}`);
      setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, id: r.message.id, answer: r.answer, facts: r.lab?.facts ?? "", error: undefined, createdAt: r.message.createdAt } : x)));
      // The same check-in as the Analyse Mentor (50 questions a day): a line, not a limit.
      setUsageNote(r.usage.warning ? `${r.usage.questionsToday} questions today, about ${money(r.usage.todayUsd)} so far (estimate).` : null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "The Mentor couldn't be reached. Try again.";
      // K10 offline: a chord question still gets Six AM's own facts in plain words (code, no model) when the Mentor can't answer.
      const f = lab.chord && (keyScale.scale === "major" || keyScale.scale === "minor") ? chordFacts({ key: keyScale.key, scale: keyScale.scale, chord: lab.chord.name, notes: lab.chord.notes, prev: lab.chord.prev, next: lab.chord.next }) : null;
      if (f) {
        setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, error: undefined, answer: { sentences: [{ text: chordFactsPlain(f), source: "general" }], tellMore: false }, facts: "Six AM's own answer (the Mentor is offline)" } : x)));
        return;
      }
      setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, error: msg } : x)));
    }
  }, [code, analysis, keyScale]);
  const pending = useRef(new Map<string, LabAsk>());
  const onAsk = useCallback((q: string, bar: number) => {
    const id = `pending-${Date.now()}`;
    const lab = labAsk(bar);
    pending.current.set(id, lab);
    setTurns((ts) => [...ts, { id, part: focus, bar, q, answer: null, facts: "", createdAt: new Date().toISOString() }]);
    setAsking(null);
    setOpenBar(bar);
    void send(id, q, bar, lab);
  }, [labAsk, focus, send]);
  const onRetry = useCallback((id: string) => {
    const x = turns.find((t) => t.id === id), lab = pending.current.get(id);
    if (!x || !lab) return;
    setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, error: undefined } : t)));
    void send(id, x.q, x.bar, lab);
  }, [turns, send]);

  /** Loops the section holding the playhead (16-bar cap), without toggling an existing loop off. */
  const loopHere = useCallback(() => {
    const t = tr.current, x = sectionAt(sections, Math.floor(msToBar(t?.heardMs() ?? 0, bpm, origin)));
    if (!t || !x) return;
    const r = loopBars({ from: x.from, to: x.to }, msToBar(t.heardMs(), bpm, origin));
    t.setLoop({ startMs: barToMs(r.from, bpm, origin), endMs: barToMs(r.to, bpm, origin) });
  }, [sections, bpm, origin]);
  // Entering Make on the bass or the drums needs the loop in memory: set one on the current section if none.
  useEffect(() => {
    if (mode === "make" && (fxPicked || focus === "bass" || focus === "drums" || focus === "other") && tr.current && !tr.current.state.loop) loopHere();
  }, [mode, focus, fxPicked, loopHere]);

  const go = (m: Mode) => {
    setMode(m);
    const url = new URL(location.href);
    url.searchParams.set("mode", m);
    history.replaceState(null, "", url);
  };

  const focusTurns = turns.filter((x) => x.part === focus);
  const artist = analysis?.uploader || map.uploader;
  // TH-3: the key's conventional name ("G#" major shows as A♭ major), the same one the chord facts spell from.
  const rawKey = map.key || analysis?.key || "", rawScale = map.scale || analysis?.scale || "";
  const convKey = rawScale === "major" || rawScale === "minor" ? conventionalKey(rawKey, rawScale) : null;
  const key = rawKey ? `${(convKey ?? rawKey).replace(/^([A-G])b/, "$1♭").replace(/^([A-G])#/, "$1♯")} ${rawScale}` : "";
  const bpmText = `${Math.round(bpm * 10) / 10}`;
  const facts = [`${bpmText} BPM`, key ? `key ${key}` : ""].filter(Boolean).join(" · ");
  const ready = ts?.phase === "ready";
  const starting = ts?.phase === "starting";
  const model = ts?.model;
  const loading = starting && !!model && !model.ready;
  const pctLoaded = model && model.total ? Math.floor((model.loaded / model.total) * 100) : 0;
  const status = loading
    ? `Getting ready… ${model!.downloading ? `${pctLoaded}%` : ""}${model!.downloading && model!.etaS !== null && model!.etaS > 3 ? ` · first time only, about ${Math.round(model!.etaS)} s` : ""}`
    // LS1-N4: a loop's first passes wait at the wrap while the Deck goes back to its start.
    // U6 (user test 12 Nov): in Make the panel says the countdown; the header only says it's filling.
    : ts?.catching ? `${ts.loop?.state === "filling" ? "filling the loop…" : "catching up…"}${ts.catchLeftS && !(mode === "make" && ts.loop?.state === "filling") ? ` ${ts.catchLeftS} s` : ""}` : "";
  const here = sectionAt(sections, pos.bar);
  const heardMsFn = useCallback(() => tr.current?.heardMs() ?? 0, []);
  const loopSec = loop ? sectionAt(sections, loop.from) : null;
  // A long section loops 16 bars of it (L161): say which (LS1-2).
  const loopPart = loop && loopSec && loop.to - loop.from < loopSec.to - loopSec.from
    ? (loop.from === loopSec.from ? `, first ${loop.to - loop.from} bars` : `, bars ${loop.from}–${loop.to - 1}`) : "";
  const deckText = ready ? "Deck on" : starting ? "Deck opening…" : ts?.deckOpen ? "Deck open" : "Deck off";
  const closedLine = ts?.phase === "stopped" && ts.deckClosed ? "Deck closed. Press Play to open it again." : null;

  return (
    <div className={s.root} data-lab-root>
      <header className={s.appBar}>
        <div className={s.logo}><Logo className={s.mark} />Six AM</div>
        <ViewsNav current="analyse" />
        <div className={s.appRight}><SettingsLink /></div>
      </header>
      <div className={s.head}>
        <a className={s.back} href="/analyse">← All tracks</a>
        <div className={s.title}>
          <h1 title={title}>{title}</h1>
          <p className={s.facts1} title={[artist, facts].filter(Boolean).join(" · ")}>
            {artist ? <span className={s.artist}>{artist}</span> : null}
            <span>{artist ? <>&nbsp;· </> : null}{facts}</span>
          </p>
        </div>
        <div className={s.actions}>
          <div className={s.transport}>
            <button className={s.play} onClick={onPlay} disabled={starting} aria-label={ts?.playing ? "Pause" : "Play"}>{ts?.playing ? "❚❚" : "▶"}</button>
            {mode === "listen" && <HearChip hear={hear} parts={parts} onClear={() => setHear({ kind: "all" })} />}
            <span className={s.clock}>{clockMs(pos.sec * 1000)}{here ? ` · in ${here.label}` : ""} <small>bar {pos.bar}</small></span>
            <span className={s.status} aria-live="polite">{status}</span>
            {loop && ts?.loop && (
              <span className={s.loopChip} title={`Looping ${loopSec?.label ?? "section"}${loopPart} · ${clockMs(ts.loop.startMs)}–${clockMs(ts.loop.endMs)}`}>
                <span className={s.loopChipText}>Looping {loopSec?.label ?? "section"}{loopPart} · {clockMs(ts.loop.startMs)}–{clockMs(ts.loop.endMs)}</span>
                <button className={s.x} onClick={() => tr.current?.setLoop(null)} aria-label={`Stop looping ${loopSec?.label ?? "the section"}`}>×</button>
              </span>
            )}
          </div>
          <div className={s.switch} role="group" aria-label="Mode">
            <button aria-pressed={mode === "listen"} onClick={() => go("listen")}>Listen</button>
            <button aria-pressed={mode === "make"} onClick={() => go("make")}>Make</button>
          </div>
          <span className={s.deck} title="SoundCloud plays in the small Six AM Deck window; you hear the parts here">
            <i className={ready ? s.dot : s.dotOff} aria-hidden />
            <span className={s.muted}>{deckText}</span>
          </span>
        </div>
      </div>
      {loading && <div className={s.progress}><i style={{ width: `${model!.downloading ? pctLoaded : 100}%` }} /></div>}
      {problem || closedLine ? <p className={s.alertLine} role="alert">{problem ?? closedLine}</p>
        : starting ? <p className={s.firstLine} role="status">{FIRST_LINE}</p> : null}
      {mode === "listen" ? (
        <div ref={grid} style={{ display: "contents" }}>
          <Lanes bars={bars} sections={sections} parts={parts} chords={chords} levels={levels} hear={hear} focus={focus}
            onOnly={onOnly} onMute={onMute} onSeek={onSeek} bar={pos.bar} loop={loop} onLoop={onLoop}
            catching={!!ts?.catching} dimmed={!ready}
            overlay={(
              <LabNotes bars={bars} turns={focusTurns} partName={PART_LABEL[focus]} playheadBar={pos.bar}
                openBar={openBar} setOpenBar={setOpenBar} asking={asking} setAsking={setAsking}
                knows={(b) => knowsLine(focus, hear, sectionAt(sections, b)?.label ?? null, b)}
                onAsk={onAsk} onRetry={onRetry} onSeek={onSeek} onMake={() => go("make")}
                lastLane={parts.at(-1)?.id === focus} busy={focusTurns.some((x) => !x.answer && !x.error)} note={usageNote} />
            )} />
        </div>
      ) : (
        <MakeRoom m={make} drums={drums} melody={melody} fx={fx} family={family} onFamily={onFamily} part={parts.find((x) => x.id === focus)!} loop={ts?.loop ?? null} section={loopSec ?? here} bpm={bpm} originSec={origin}
          chords={chords} levels={levels} heardMs={heardMsFn} status={status} ready={ready} playing={!!ts?.playing}
          bar={pos.bar} turns={focusTurns} onAsk={onAsk} onRetry={onRetry} onSeek={onSeek} onJump={onJump} onLoopHere={loopHere} onBass={() => setFocus("bass")}
          busy={focusTurns.some((x) => !x.answer && !x.error)} note={usageNote} />
      )}
    </div>
  );
}
