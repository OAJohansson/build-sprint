// Phase 6 slice 1 (K3, K4, K8): Make's chords as the owner hears them. Reader A (chords-read.ts) gives
// a guess per cell with ranked alternatives; this file holds what the owner does with it: which name
// each cell plays in Mine (picks), which cells Make isn't sure of ("?"), the cards to try, the key's
// other chords ("More chords"), plain feel words, and the names saved with a sound. Pure; only type
// imports from the reader, so the library (and the API route) can parse names without the DSP code.
import { PITCHES } from "@/lib/lab/chords";
import { pitchClass, type Scale } from "@/lib/synths/theory";
import type { ChordCell, ChordEvent, ChordType, ChordsReading } from "./chords-read";

const SUFFIX: Record<string, ChordType> = { "": "maj", m: "min", "7": "7", maj7: "maj7", m7: "m7", sus2: "sus2", sus4: "sus4", dim: "dim" };
const SUFFIX_OF: Record<ChordType, string> = { maj: "", min: "m", "7": "7", maj7: "maj7", m7: "m7", sus2: "sus2", sus4: "sus4", dim: "dim" };
const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** "G7", "B♭m", "Db" → root (pitch class) and type, or null. Accepts ♭/♯ and enharmonic spellings. */
export function parseChord(name: string): { root: number; type: ChordType; name: string } | null {
  const m = /^\s*([A-Ga-g][#♯b♭]?)(.*?)\s*$/.exec(name ?? "");
  if (!m) return null;
  const root = pitchClass(m[1]);
  const type = SUFFIX[m[2]];
  if (root === null || !type) return null;
  return { root, type, name: PITCHES[mod12(root)] + SUFFIX_OF[type] };
}
/** The reader's spelling of a name ("B♭m" → "Bbm"), or null when it isn't a chord Make plays. */
export const normalChord = (name: string) => parseChord(name)?.name ?? null;
/** For the screen: real flat and sharp signs ("Bbm" → "B♭m"). */
export const prettyChord = (name: string) => name.replace(/^([A-G])b/, "$1♭").replace(/^([A-G])#/, "$1♯");

/** How a chord's flavour sounds, in plain words (design round 5, L260: no theory words). */
const FLAVOUR: Record<ChordType, string> = {
  maj: "bright, plain", min: "darker, softer", "7": "bluesy, restless", m7: "soft, smooth", maj7: "dreamy, warm",
  sus2: "open, floating", sus4: "open, waiting", dim: "tense",
};
export const flavour = (name: string) => { const p = parseChord(name); return p ? FLAVOUR[p.type] : ""; };

// shortcut (CS1-2, T181): the "?" rule is set from one real read (Lost 69–76: its weakest cell, Csus2 at 0.87,
// went unflagged under T173) and the modelled fixtures, not fitted on graded labels: a cell scoring under 0.9,
// the loop's lowest cell when 0.05 under the median, a rival on another root within 0.035, the smoothing
// having overruled a higher-scoring chord, or a cell 12 % weaker than its twins; at most a third of the cells
// (the lowest-scoring first). Re-check against data-evals' real-loop labels once more loops are read.
export const UNSURE = { lowScore: 0.9, lowestMargin: 0.05, rootMargin: 0.035, weakShare: 0.88, share: 1 / 3 };

/**
 * Which cells Make isn't sure of. Not the 7th's margin: the reader sets a 7th +0.005 or −0.03 from its
 * triad by rule (L257), so that gap says nothing. Unsure when the cell's own score is low, when it is
 * clearly the loop's weakest, when a chord on another root nearly ties, when the loop smoothing kept a
 * chord over a higher-scoring one, or when it reads much weaker than the other cells with its name.
 * Capped at a third of the cells so "?" still points somewhere.
 */
export function unsureCells(cells: ChordCell[]): boolean[] {
  const byName = new Map<string, number[]>();
  for (const c of cells) if (c.name) byName.set(c.name, [...(byName.get(c.name) ?? []), c.score]);
  const med = (v: number[]) => [...v].sort((a, b) => a - b)[v.length >> 1];
  const named = cells.filter((c) => c.name && c.root !== null);
  const allMed = named.length ? med(named.map((c) => c.score)) : 0;
  const lowest = named.length ? Math.min(...named.map((c) => c.score)) : 0;
  const flag = cells.map((c) => {
    if (!c.name || c.root === null) return false;
    const rival = c.alternatives.find((a) => a.root !== c.root);
    const overruled = c.alternatives.some((a) => a.score > c.score + 1e-9);
    const close = !!rival && c.score - rival.score < UNSURE.rootMargin;
    const twins = byName.get(c.name) ?? [];
    const weak = twins.length >= 3 && c.score < UNSURE.weakShare * med(twins);
    const low = c.score < UNSURE.lowScore;
    const weakest = named.length >= 3 && c.score === lowest && c.score < allMed - UNSURE.lowestMargin;
    return overruled || close || weak || low || weakest;
  });
  const cap = Math.max(1, Math.round(cells.length * UNSURE.share));
  const keep = new Set(cells.map((c, i) => ({ i, score: c.score })).filter((x) => flag[x.i]).sort((a, b) => a.score - b.score).slice(0, cap).map((x) => x.i));
  return cells.map((_, i) => keep.has(i));
}

/** The pitch classes a chord name plays. */
export const chordPcs = (name: string): number[] => { const p = parseChord(name); return p ? TEMPLATES[p.type].map((i) => mod12(p.root + i)) : []; };
const TEMPLATES: Record<ChordType, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], "7": [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6] };

// shortcut (CS1-1, T190): the 0.25 "played" level and the F-score are reasoned, not fitted; check against the owner's ear.
export const MATCH = { played: 0.25 };

/**
 * CS1-1: how well Mine's chords match the notes the part plays, 0–100. Per cell, two shares of the
 * part's pitch classes there: how much of what the part plays is in Mine's chord (so a 7th the track
 * plays counts for G7 over G), and how much of Mine's chord the part plays (each note counts in full
 * at a quarter of the cell's strongest pitch class or more, so a 7th the track lacks counts against
 * G7); combined as their F-score, averaged weighted by how much the cell sounds. Null when nothing to compare.
 */
export function notesMatch(cellChroma: number[][], pcsPerCell: number[][]): number | null {
  let sum = 0, w = 0;
  cellChroma.forEach((ch, i) => {
    const pcs = [...new Set(pcsPerCell[i] ?? [])], tot = ch.reduce((a, b) => a + b, 0), top = Math.max(...ch);
    if (!pcs.length || tot <= 0 || top <= 0) return;
    const covered = pcs.reduce((a, p) => a + ch[p], 0) / tot;
    const played = pcs.reduce((a, p) => a + Math.min(1, ch[p] / (MATCH.played * top)), 0) / pcs.length;
    const f = covered + played > 0 ? (2 * covered * played) / (covered + played) : 0;
    sum += tot * f;
    w += tot;
  });
  return w > 0 ? Math.round((sum / w) * 1000) / 10 : null;
}

/** The cards for a cell: Make's guess and its next 3 alternatives (H5 measures the same four). */
export function cardsFor(cell: ChordCell): string[] {
  return [...new Set([cell.name, ...cell.alternatives.map((a) => a.name)].filter(Boolean))].slice(0, 4);
}

/** The key's chords ("More chords"): its seven triads, plus the V7 (and in minor the major V, harmonic minor). */
export function keyChords(key: string, scale: Scale | null): string[] {
  const t = pitchClass(key);
  if (t === null || !scale) return [];
  const steps: [number, ChordType][] = scale === "major"
    ? [[0, "maj"], [2, "min"], [4, "min"], [5, "maj"], [7, "maj"], [9, "min"], [11, "dim"], [7, "7"]]
    : [[0, "min"], [2, "dim"], [3, "maj"], [5, "min"], [7, "min"], [8, "maj"], [10, "maj"], [7, "maj"], [7, "7"]];
  return steps.map(([iv, type]) => PITCHES[mod12(t + iv)] + SUFFIX_OF[type]);
}

/** A hit on the 16th grid inside a cell: its 16th (from the cell's start), length in 16ths, and how far off the grid it sits (a 16th's fraction). */
export type Hit = { at: number; len: number; off?: number };
/**
 * What the owner changed in one cell (K4–K6): a chord name (a card), their own notes from the piano
 * (MIDI, the name then is the closest one), and their own hits (replacing the read times in that cell).
 */
export type CellEdit = { name?: string; notes?: number[]; hits?: Hit[] };
export type Edits = Record<number, CellEdit>;

/** Mine's cells: each cell's name as edited (or planted for a test), else Make's guess. */
export function cellsWithPicks(cells: ChordCell[], picks: Record<number, string>): ChordCell[] {
  return cells.map((c, i) => {
    const p = picks[i] !== undefined ? parseChord(picks[i]) : null;
    return p ? { ...c, name: p.name, root: p.root, type: p.type } : c;
  });
}

const r4 = (x: number) => Math.round(x * 10000) / 10000;

/** One chord event at `t` seconds (loop time) for `cell`; struck unless it lasts 1.5 beats or more (held). */
function eventAt(c: ChordsReading, t: number, dur: number, cell: number, struck: boolean, vel: number): ChordEvent {
  const sps = 60 / c.bpm / 4, raw = t / sps, step = Math.round(raw), held = dur >= 6 * sps;
  return { t: r4(t), dur: r4(dur), step: ((step % c.steps) + c.steps) % c.steps, off: Math.round((raw - step) * 1000) / 1000, cell, struck: struck && !held, held, vel };
}

/** A cell's sound identity: name and own notes (two cells sound the same chord only if both match). */
const soundOf = (cells: ChordCell[], edits: Edits, k: number) => `${cells[k]?.name}|${edits[k]?.notes?.join(".") ?? ""}`;

/**
 * The reading with the owner's edits in it (K3–K6, L251): names per cell; then the times. The reader lets
 * one chord sound on into the next cell when both are the same (a pad held over two bars, H3); once an
 * edit makes them differ, the event is cut at the cell line and the next cell's chord takes over there,
 * held for the rest of that sound. A cell with its own hits drops the read times in it (anything sounding
 * into it stops at its line) and plays exactly those hits.
 */
export function withEdits(c: ChordsReading, edits: Edits): ChordsReading {
  const picks: Record<number, string> = {};
  for (const [k, e] of Object.entries(edits)) if (e.name) picks[+k] = e.name;
  const cells = cellsWithPicks(c.cells, picks);
  const sps = 60 / c.bpm / 4, loopS = c.steps * sps;
  const ownHits = (k: number) => !!edits[k]?.hits;
  const events: ChordEvent[] = [];
  for (const e of c.events) {
    if (ownHits(e.cell)) continue;
    const end = e.t + e.dur;
    let k = e.cell, start = e.t, cell = e.cell, first = true, stopped = false;
    while (cells[k + 1] && cells[k + 1].startStep * sps < end - 1e-4) {
      k++;
      const at = cells[k].startStep * sps;
      if (ownHits(k)) { if (at > start + 1e-4) events.push(eventAt(c, start, at - start, cell, first && e.struck, e.vel)); stopped = true; break; }
      if (soundOf(cells, edits, k) === soundOf(cells, edits, cell)) continue;
      if (at > start + 1e-4) events.push(eventAt(c, start, at - start, cell, first && e.struck, e.vel));
      start = at; cell = k; first = false;
    }
    if (stopped) continue;
    if (first) events.push(e);
    else events.push(eventAt(c, start, end - start, cell, false, e.vel));
  }
  cells.forEach((cell, k) => {
    for (const h of edits[k]?.hits ?? []) {
      const t = Math.max(0, (cell.startStep + h.at + (h.off ?? 0)) * sps), dur = Math.min(h.len * sps, loopS - t);
      if (dur > 0.005) events.push(eventAt(c, t, dur, k, true, 0.8));
    }
  });
  events.sort((a, b) => a.t - b.t);
  return { ...c, cells, events };
}
/** withEdits with names only (slice 1's picks). */
export const withPicks = (c: ChordsReading, picks: Record<number, string>) => withEdits(c, Object.fromEntries(Object.entries(picks).map(([k, n]) => [k, { name: n }])));

/** A cell's hits as the timing strip shows them, from Mine's events that start in it (to the 16th, the offset kept). */
export function hitsOf(c: ChordsReading, cell: number): Hit[] {
  const sps = 60 / c.bpm / 4, x = c.cells[cell];
  if (!x) return [];
  return c.events.filter((e) => e.cell === cell).map((e) => {
    const pos = e.t / sps - x.startStep, at = Math.max(0, Math.min(x.steps - 1, Math.round(pos))), off = Math.round(Math.max(-0.5, Math.min(0.5, pos - at)) * 100) / 100;
    return { at, len: Math.max(0.25, Math.min(x.steps - at, Math.round((e.dur / sps) * 100) / 100)), ...(off ? { off } : {}) };
  }).sort((a, b) => a.at - b.at);
}

/** "Short hits": this cell's own read stabs when it has two or more, else the loop's first cell that has, else four on the beats. */
export function shortHits(c: ChordsReading, cell: number): Hit[] {
  const x = c.cells[cell];
  if (!x) return [];
  const own = hitsOf(c, cell).filter((h) => h.len < 6);
  if (own.length >= 2) return own;
  for (let k = 0; k < c.cells.length; k++) {
    if (c.cells[k].steps !== x.steps) continue;
    const hs = hitsOf(c, k).filter((h) => h.len < 6);
    if (hs.length >= 2) return hs;
  }
  return Array.from({ length: Math.max(1, Math.floor(x.steps / 4)) }, (_, b) => ({ at: b * 4, len: 1 }));
}
/** "Held": one chord through the whole cell. */
export const heldHits = (steps: number): Hit[] => [{ at: 0, len: steps }];
export const sameHits = (a: Hit[], b: Hit[]) => a.length === b.length && a.every((x, k) => x.at === b[k].at && Math.abs(x.len - b[k].len) < 1e-6 && Math.abs((x.off ?? 0) - (b[k].off ?? 0)) < 1e-6);

/** Room for a hit at `at`, `len` long, in a cell of `steps`, besides the hit `skip`. */
export const hitFits = (hits: Hit[], at: number, len: number, steps: number, skip = -1) =>
  at >= 0 && at + len <= steps + 1e-6 && hits.every((x, k) => k === skip || at + len <= x.at + 1e-6 || at >= x.at + x.len - 1e-6);

/** One timing move on a cell's hits (K6). Returns the new hits, or null when it doesn't fit. */
export function moveHit(hits: Hit[], k: number, op: "earlier" | "later" | "shorter" | "longer" | "remove", steps: number): Hit[] | null {
  const h = hits[k];
  if (!h) return null;
  if (op === "remove") return hits.filter((_, j) => j !== k);
  const nx = op === "earlier" ? { ...h, at: h.at - 1 } : op === "later" ? { ...h, at: h.at + 1 } : op === "shorter" ? { ...h, len: h.len - 1 } : { ...h, len: h.len + 1 };
  if (nx.len < 1 - 1e-6 && op === "shorter") return null;
  if (!hitFits(hits, nx.at, nx.len, steps, k)) return null;
  return hits.map((x, j) => (j === k ? nx : x)).sort((a, b) => a.at - b.at);
}
/** A new one-16th hit on an empty 16th. */
export function addHit(hits: Hit[], at: number, steps: number): Hit[] | null {
  return hitFits(hits, at, 1, steps) ? [...hits, { at, len: 1 }].sort((a, b) => a.at - b.at) : null;
}

/** A chord name over a stretch of a saved pattern (16ths from the repeat's start), with the owner's own notes and hits when edited (H9). */
export type ChordMark = { step: number; steps: number; name: string; notes?: number[]; hits?: Hit[] };

/**
 * What to save with a folded pattern of `bars`: per half bar of the repeat, what most of its repeats
 * play there (the name, own notes and own hits of the cell covering it; the first on a tie), then a bar
 * whose halves agree in name and notes as one mark. Never overlapping.
 */
export function foldChordNames(cells: ChordCell[], bars: number, edits: Edits = {}): ChordMark[] {
  const P = bars * 16, halves = P / 8;
  type Half = { name: string; notes?: number[]; hits?: Hit[] };
  const votes: Map<string, { n: number; v: Half }>[] = Array.from({ length: halves }, () => new Map());
  cells.forEach((c, i) => {
    if (!c.name) return;
    const e = edits[i];
    for (let s = c.startStep; s < c.startStep + c.steps; s += 8) {
      const rel = s - c.startStep;
      const hits = e?.hits?.filter((h) => h.at >= rel && h.at < rel + 8).map((h) => ({ ...h, at: h.at - rel }));
      const v: Half = { name: c.name, ...(e?.notes ? { notes: e.notes } : {}), ...(hits ? { hits } : {}) };
      const key = JSON.stringify(v), m = votes[Math.floor((s % P) / 8)];
      m.set(key, { n: (m.get(key)?.n ?? 0) + 1, v });
    }
  });
  const best = votes.map((m) => [...m.values()].reduce<{ n: number; v: Half } | null>((a, b) => (!a || b.n > a.n ? b : a), null)?.v ?? null);
  const out: ChordMark[] = [];
  for (let h = 0; h < halves; h += 2) {
    const a = best[h], b = best[h + 1] ?? null;
    if (a && b && a.name === b.name && (a.notes?.join() ?? "") === (b.notes?.join() ?? "") && !!a.hits === !!b.hits) {
      const hits = a.hits ? [...a.hits, ...b.hits!.map((x) => ({ ...x, at: x.at + 8 }))] : undefined;
      out.push({ step: h * 8, steps: 16, name: a.name, ...(a.notes ? { notes: a.notes } : {}), ...(hits ? { hits } : {}) });
    } else {
      if (a) out.push({ step: h * 8, steps: 8, ...a });
      if (b) out.push({ step: (h + 1) * 8, steps: 8, ...b });
    }
  }
  return out;
}

/** Edits that bring a saved sound's names, notes and hits back onto this loop's cells (by position in the repeat); names only where they differ from Make's guess. */
export function editsFromSaved(cells: ChordCell[], saved: ChordMark[], bars: number): Edits {
  const P = bars * 16, out: Edits = {};
  cells.forEach((c, i) => {
    const pos = c.startStep % P;
    const marks = saved.filter((x) => x.step < pos + c.steps && x.step + x.steps > pos);
    const m = marks.find((x) => pos >= x.step && pos < x.step + x.steps);
    if (!m) return;
    const e: CellEdit = {};
    const n = normalChord(m.name);
    if (n && n !== c.name) e.name = n;
    if (m.notes?.length) { e.notes = [...m.notes]; if (n) e.name = n; }
    if (marks.some((x) => x.hits)) {
      e.hits = marks.flatMap((x) => (x.hits ?? []).map((h) => ({ ...h, at: h.at + x.step - pos }))).filter((h) => h.at >= 0 && h.at < c.steps).sort((a, b) => a.at - b.at);
    }
    if (Object.keys(e).length) out[i] = e;
  });
  return out;
}
/** Slice 1's name-only restore. */
export const picksFromSaved = (cells: ChordCell[], saved: ChordMark[], bars: number): Record<number, string> =>
  Object.fromEntries(Object.entries(editsFromSaved(cells, saved, bars)).filter(([, e]) => e.name).map(([k, e]) => [k, e.name!]));

// ── K9: the Studio drawer ──────────────────────────────────────────────────────────────────────

/** A chord name moved by `semis` semitones (the Studio plays a sound in the track's key). */
export function transposeChord(name: string, semis: number): string | null {
  const p = parseChord(name);
  return p ? PITCHES[mod12(p.root + semis)] + SUFFIX_OF[p.type] : null;
}

type PatNote = { step: number; midi: number; dur: number; vel: number; off?: number };
/**
 * A saved pattern with one mark's chord changed by name (the Studio drawer, K9): the mark's notes are
 * replaced by the new chord in its standard voicing (`voice`, chords-read's voiceChord) at the same
 * times, lengths and strengths, around the same pitch; the mark loses any own notes. Null when the name
 * isn't a chord Make plays.
 */
export function revoiceMark<P extends { bars: number; notes: PatNote[]; chords?: ChordMark[] }>(pat: P, i: number, name: string, voice: (root: number, type: ChordType, register: number) => number[]): P | null {
  const m = pat.chords?.[i], p = parseChord(name);
  if (!m || !p) return null;
  const inside = (n: PatNote) => n.step >= m.step && n.step < m.step + m.steps;
  const old = pat.notes.filter(inside);
  const register = old.length ? Math.round(old.reduce((a, n) => a + n.midi, 0) / old.length) : 60;
  const times = new Map<string, Omit<PatNote, "midi">>();
  for (const n of old) times.set(`${n.step}|${n.off ?? 0}|${n.dur}|${n.vel}`, { step: n.step, dur: n.dur, vel: n.vel, ...(n.off ? { off: n.off } : {}) });
  const midis = voice(p.root, p.type, register);
  const fresh = [...times.values()].flatMap((t) => midis.map((midi) => ({ ...t, midi })));
  const notes = [...pat.notes.filter((n) => !inside(n)), ...fresh].sort((a, b) => a.step - b.step || a.midi - b.midi);
  const chords = pat.chords!.map((x, k) => (k === i ? { step: x.step, steps: x.steps, name: p.name, ...(x.hits ? { hits: x.hits } : {}) } : x));
  return { ...pat, notes, chords };
}
