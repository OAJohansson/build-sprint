// The Mentor in the Lab (S2, job 3, B6; L156, L171, T87): what the Lab sends with a question (the
// focus part, what you hear, the bar and section, the chords heard so far, and simple numbers
// measured from the looped part in memory), how the server writes that into the prompt, and how a
// track's notes come back out of the stored thread. Text and numbers only, never audio (L143).
// Pure: shared by the Lab, the server and the tests.
import type { PartName } from "@/lib/lab/live";
import { labParts, labSections, sectionAt } from "@/lib/lab/view";
import type { TrackMap } from "@/lib/map/types";
import { midiName, pitchClass, usesFlats } from "@/lib/synths/theory";
import type { MentorAnswer } from "./answer";

export const PART_LABEL: Record<PartName, string> = { drums: "Drums", bass: "Bass", other: "Other", vocals: "Vocals" };

/** What you hear (L177): everything, only some parts, or everything without some. */
export type LabHear = { kind: "all" } | { kind: "only"; parts: PartName[] } | { kind: "mute"; parts: PartName[] };

/**
 * Numbers measured from the focus part while a loop holds it in memory (L161). Pitch fields only
 * for the bass (a single low line); for drums, other and vocals the level and note starts only.
 */
export type PartMeasure = {
  /** The loop the numbers come from (1-based bars, `to` exclusive). */
  from: number;
  to: number;
  /** RMS level of the part over the loop, dB (rounded). */
  levelDb: number;
  /** Note starts per bar, on the 16th grid. */
  notesPerBar?: number;
  /** Lowest and highest note of the estimated pattern, MIDI (snapped into the key). */
  lowMidi?: number;
  highMidi?: number;
  /** Median note length in 16ths. */
  lengthSteps?: number;
  /** How many bars the pattern takes before it repeats (1, 2 or 4). */
  patternBars?: number;
};

/** The `lab` field of a Lab question. `bar` is where the note pins (the card's bar, or the playhead). */
export type LabAsk = {
  part: PartName;
  hear: LabHear;
  bar: number;
  playheadBar: number;
  loop: { from: number; to: number } | null;
  /** Chord names per 8 bars heard so far ("" no clear chord, null not heard). */
  chords: (string | null)[];
  measure: PartMeasure | null;
};

/** One exchange, as the map and the Mentor rail show it. */
export type LabNote = { id: string; part: PartName; bar: number; q: string; answer: MentorAnswer; facts: string; createdAt: string; costUsd: number };

/** What the assistant row stores next to the answer (the bar and part it pins to, the facts line). */
export type LabMeta = { bar: number; part: PartName; facts: string };

/** One thread per track; the column holds 600 characters. */
export const labThread = (trackId: string) => `lab:${trackId}`.slice(0, 600);

/** The Lab's parts, in the separator's order (live.ts PART_NAMES; not imported, so the server never loads the audio code). */
export const LAB_PARTS: readonly PartName[] = ["drums", "bass", "other", "vocals"];
const isPart = (v: unknown): v is PartName => typeof v === "string" && (LAB_PARTS as readonly string[]).includes(v);
const int = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : null);
const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : undefined);

/** Whitelist parser for the browser's `lab` field; null if it isn't one. */
export function parseLabAsk(raw: unknown, bars: number): LabAsk | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const bar = int(r.bar, 1, bars), playheadBar = int(r.playheadBar, 1, bars);
  if (!isPart(r.part) || bar === null) return null;
  const h = (r.hear ?? {}) as Record<string, unknown>;
  const hp = (Array.isArray(h.parts) ? h.parts : []).filter(isPart);
  const hear: LabHear = (h.kind === "only" || h.kind === "mute") && hp.length ? { kind: h.kind, parts: [...new Set(hp)] } : { kind: "all" };
  const l = (r.loop ?? null) as Record<string, unknown> | null;
  const lf = l ? int(l.from, 1, bars) : null, lt = l ? int(l.to, 2, bars + 1) : null;
  const loop = lf !== null && lt !== null && lt > lf ? { from: lf, to: lt } : null;
  const cells = Math.ceil(bars / 8);
  const chords = Array.isArray(r.chords) && r.chords.length === cells && r.chords.every((c) => c === null || (typeof c === "string" && /^([A-G](#|b)?m?)?$/.test(c)))
    ? (r.chords as (string | null)[]) : [];
  const m = (r.measure ?? null) as Record<string, unknown> | null;
  let measure: PartMeasure | null = null;
  if (m && loop) {
    const levelDb = num(m.levelDb, -140, 20);
    if (levelDb !== undefined) {
      measure = { from: loop.from, to: loop.to, levelDb: Math.round(levelDb) };
      const npb = num(m.notesPerBar, 0, 64), lo = num(m.lowMidi, 12, 108), hi = num(m.highMidi, 12, 108), len = num(m.lengthSteps, 0, 64), pb = num(m.patternBars, 1, 4);
      if (npb !== undefined) measure.notesPerBar = Math.round(npb * 10) / 10;
      if (lo !== undefined && hi !== undefined && hi >= lo) { measure.lowMidi = Math.round(lo); measure.highMidi = Math.round(hi); }
      if (len !== undefined) measure.lengthSteps = Math.round(len * 10) / 10;
      if (pb !== undefined) measure.patternBars = Math.round(pb);
    }
  }
  return { part: r.part, hear, bar, playheadBar: playheadBar ?? bar, loop, chords, measure };
}

/** A1, Bb1: spelled for the key (G minor writes flats). */
export const noteName = (midi: number, flats = false) => midiName(midi, flats);
/** Whether the track's key writes flats ("G minor" → true). */
export function keyFlats(key: string, scale: string): boolean {
  const pc = pitchClass(key);
  return pc !== null && (scale === "major" || scale === "minor") && usesFlats(pc, scale);
}
const hz = (midi: number) => Math.round(440 * Math.pow(2, (midi - 69) / 12));
/** 16ths as the note value people say: 2 → "1/8", 4 → "1/4", 1 → "1/16". */
export function noteValue(steps: number): string {
  if (steps <= 0.75) return "1/32";
  if (steps < 1.5) return "1/16";
  if (steps < 3) return "1/8";
  if (steps < 6) return "1/4";
  if (steps < 12) return "1/2";
  return "a bar or more";
}

/** The mono facts line under an answer: what was measured, never a judgement ("A1 · 55 Hz · notes ≈ 1/8 · −14 dB"). */
export function factsLine(m: PartMeasure | null, flats = false): string {
  if (!m) return "";
  const out: string[] = [];
  if (m.lowMidi !== undefined && m.highMidi !== undefined) {
    out.push(m.lowMidi === m.highMidi ? noteName(m.lowMidi, flats) : `${noteName(m.lowMidi, flats)}–${noteName(m.highMidi, flats)}`);
    out.push(m.lowMidi === m.highMidi ? `${hz(m.lowMidi)} Hz` : `${hz(m.lowMidi)}–${hz(m.highMidi)} Hz`);
  }
  if (m.lengthSteps !== undefined && m.lengthSteps > 0) out.push(`notes ≈ ${noteValue(m.lengthSteps)}`);
  if (m.notesPerBar !== undefined) out.push(`${m.notesPerBar} a bar`);
  out.push(`${m.levelDb <= -90 ? "silent" : `${m.levelDb > 0 ? "+" : m.levelDb < 0 ? "−" : ""}${Math.abs(m.levelDb)} dB`}`);
  return out.join(" · ");
}

/** "Only Bass", "everything but Vocals", "everything". */
export function hearText(h: LabHear): string {
  const names = (ps: PartName[]) => ps.map((p) => PART_LABEL[p]).join(" and ");
  return h.kind === "only" ? `only ${names(h.parts)} (the other parts are silent)` : h.kind === "mute" ? `everything except ${names(h.parts)} (muted)` : "everything (all four parts)";
}

/** "The Mentor knows: Bass alone, Drop 1, bar 97; pitch, timing and loudness. Not tone." */
export function knowsLine(part: PartName, hear: LabHear, section: string | null, bar: number): string {
  const alone = hear.kind === "only" && hear.parts.length === 1 && hear.parts[0] === part ? `${PART_LABEL[part]} alone` : PART_LABEL[part];
  return `The Mentor knows: ${[alone, section, `bar ${bar}`].filter(Boolean).join(", ")}; pitch, timing and loudness. Not tone.`;
}

/**
 * The Lab's facts for the prompt: where the person is, what they hear, the map's estimate for the
 * focus part around that bar, the chords heard so far, and the looped part's numbers. Every line
 * says where it came from; nothing claims to be heard.
 */
export function labContextText(ask: LabAsk, map: TrackMap): string {
  const sections = labSections(map);
  const sec = sectionAt(sections, ask.bar);
  const head = sectionAt(sections, ask.playheadBar);
  const part = labParts(map).find((p) => p.id === ask.part);
  const name = PART_LABEL[ask.part];
  const block = part?.blocks.find((b) => ask.bar >= b.from && ask.bar < b.to);
  const runs = (part?.blocks ?? []).filter((b) => b.to - b.from >= 4).slice(0, 8).map((b) => `bars ${b.from}–${b.to - 1}${b.level === "maybe" ? " (maybe)" : ""}`);
  const heard = ask.chords.map((c, i) => ({ c, from: 1 + i * 8 })).filter((x) => x.c !== null && x.from <= map.bars);
  // Runs of the same chord, so a long track stays short: "bars 1–16 Am, 17–24 F".
  const chordRuns: { name: string; from: number; to: number }[] = [];
  for (const x of heard) {
    const last = chordRuns.at(-1), name = x.c || "no clear chord";
    if (last && last.name === name && last.to === x.from) last.to = x.from + 8;
    else chordRuns.push({ name, from: x.from, to: x.from + 8 });
  }
  const chordAt = ask.chords[Math.floor((ask.bar - 1) / 8)];
  const m = ask.measure;
  const flats = keyFlats(map.key, map.scale);
  const lines = [
    `[lab] The person is in the Lab: the track plays as four separated parts (drums, bass, other, vocals), split in their browser. You get only the text and numbers below, never the audio.`,
    `[lab] Question pinned at bar ${ask.bar}${sec ? `, in ${sec.label} (bars ${sec.from}–${sec.to - 1})` : ""}. The playhead is at bar ${ask.playheadBar}${head ? ` (${head.label})` : ""}.`,
    `[lab] Focus part (what the question is about unless it names another): ${name}. They are hearing ${hearText(ask.hear)}.`,
    `[lab] Sections: ${sections.map((x) => `${x.label} ${x.from}–${x.to - 1}`).join("; ") || "none"}.`,
    `[ears] The map's estimate for the ${name.toLowerCase()} (from frequency bands of the full mix, not the separated part): at bar ${ask.bar} ${block ? (block.level === "likely" ? "likely playing" : "maybe playing") : "probably not playing"}; plays ${runs.join(", ") || "nowhere clearly"}.`,
    chordRuns.length
      ? `[lab] Chords heard so far (estimated per 8 bars from the separated bass and other parts, triads only): ${chordRuns.map((x) => `bars ${x.from}–${Math.min(x.to, map.bars + 1) - 1} ${x.name}`).join("; ")}.${chordAt !== undefined && chordAt !== null ? ` At bar ${ask.bar}: ${chordAt || "no clear chord"}.` : ` Bar ${ask.bar} not heard yet.`}`
      : `[lab] No chords heard yet.`,
    m
      ? `[lab] Measured from the ${name.toLowerCase()} itself, looped in memory over bars ${m.from}–${m.to - 1}: ${[
        m.lowMidi !== undefined && m.highMidi !== undefined ? `notes from ${noteName(m.lowMidi, flats)} to ${noteName(m.highMidi, flats)} (estimated, snapped into the key)` : "",
        m.patternBars ? `a ${m.patternBars}-bar pattern` : "",
        m.notesPerBar !== undefined ? `${m.notesPerBar} note starts a bar` : "",
        m.lengthSteps !== undefined && m.lengthSteps > 0 ? `notes about ${noteValue(m.lengthSteps)} long` : "",
        `level ${m.levelDb} dB RMS (${m.levelDb > -18 ? "loud" : m.levelDb > -30 ? "moderate" : "quiet"})`,
      ].filter(Boolean).join(", ")}.`
      : `[lab] No loop is held, so there are no measurements of the ${name.toLowerCase()} itself, only the map's estimates.`,
  ];
  return lines.join("\n");
}

/** Pairs the stored thread back into notes: a question, then its answer (the answer row carries the bar and part). */
export type ThreadItem = { id: string; role: "user"; text: string; createdAt: string } | { id: string; role: "assistant"; answer: unknown; createdAt: string; costUsd?: number };
export function notesFromThread(messages: ThreadItem[]): LabNote[] {
  const out: LabNote[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const q = messages[i], a = messages[i + 1];
    if (q.role !== "user" || a.role !== "assistant") continue;
    const ans = a.answer as (MentorAnswer & { lab?: Partial<LabMeta> }) | null;
    const meta = ans?.lab;
    if (!ans || !Array.isArray(ans.sentences) || !meta || !isPart(meta.part) || typeof meta.bar !== "number") continue;
    const { lab: _lab, ...answer } = ans;
    void _lab;
    out.push({ id: a.id, part: meta.part, bar: meta.bar, q: q.text, answer, facts: typeof meta.facts === "string" ? meta.facts : "", createdAt: a.createdAt, costUsd: a.costUsd ?? 0 });
    i++;
  }
  return out;
}

export type NoteGroup<T extends { bar: number; createdAt: string } = LabNote> = { bar: number; notes: T[] };
/** Dots on the lane (L171): questions within 3% of the track share one dot, at the first's bar. */
export function groupNotes<T extends { bar: number; createdAt: string }>(notes: T[], bars: number): NoteGroup<T>[] {
  const gap = bars * 0.03;
  const groups: NoteGroup<T>[] = [];
  for (const x of [...notes].sort((a, b) => a.bar - b.bar || a.createdAt.localeCompare(b.createdAt))) {
    const g = groups.at(-1);
    if (g && x.bar - g.bar < gap) g.notes.push(x);
    else groups.push({ bar: x.bar, notes: [x] });
  }
  for (const g of groups) g.notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return groups;
}

/**
 * Where the card hangs (handoff §6): below the focus lane, right of the dot unless that crosses the
 * playhead or runs out of room, then left. `beside` (the focus lane is the last): the card sits
 * next to the dot instead, 20 px off. Pixel positions on the timeline; returns the card's left.
 */
export function cardLeft(dotPx: number, playheadPx: number, widthPx: number, cardPx = 420, beside = false): number {
  const right = dotPx + (beside ? 20 : 0);
  const fits = right + cardPx <= widthPx;
  const crosses = dotPx < playheadPx && right + cardPx > playheadPx;
  if (fits && !crosses) return right;
  return Math.max(0, Math.min(widthPx - cardPx, dotPx - (beside ? 20 : -14) - cardPx));
}

// ── "Never claims to hear" (B6) ──────────────────────────────────────────────────────────────────

/** A question about tone or timbre: what the Mentor can't measure. */
export const TONE_QUESTION = /\b(tone|timbre|sound(?:s|ing)? like|warm|bright|dark|gritty|grit|distort\w*|saturat\w*|fat|thick|rubbery|rubber|character|texture|filter\w*|resonan\w*|cutoff|saw|square|sine|wave ?form|synth (?:is|was)|which synth|what synth|plugin|preset|patch|fx|effects?|reverb|delay|chorus|squelch\w*|wobbl\w*)\b/i;
/** The answer says it can't hear the sound itself. */
export const CANT_HEAR = /\b(can(?:'|’)t|cannot|can not|don(?:'|’)t|do not|never)\s+(?:actually\s+)?(?:hear|listen|measure (?:its |the )?(?:tone|timbre|sound))|\bnot (?:the )?(?:tone|timbre)\b|\bno (?:audio|ears)\b|\bonly (?:get|have|see|measure)\b[^.]*\b(?:pitch|timing|loudness|numbers)/i;
/** A claim to have heard the audio. */
export const HEARD_CLAIM = /\bI(?:'m| am)?\s+(?:can\s+)?(?:hear|hearing)\b|\bI(?:'ve| have)?\s+(?:listened|heard)\b|\b(?:it|this|that|the (?:bass|drums|part|line|kick|synth|vocal|vocals|pad|chord|chords|lead|stab))\s+sounds\b|\bsounds like\b/i;
