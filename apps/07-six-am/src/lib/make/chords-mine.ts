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

/**
 * CS1-1: how well Mine's chords match the notes the part plays, 0–100: per cell, the cosine between the
 * part's pitch classes there and the chord's own notes, averaged weighted by how much the cell sounds.
 * Null when there is nothing to compare.
 */
export function notesMatch(cellChroma: number[][], names: string[]): number | null {
  let sum = 0, w = 0;
  cellChroma.forEach((ch, i) => {
    const pcs = chordPcs(names[i] ?? ""), tot = ch.reduce((a, b) => a + b, 0);
    if (!pcs.length || tot <= 0) return;
    const norm = Math.hypot(...ch), dot = pcs.reduce((a, p) => a + ch[p], 0);
    sum += tot * (dot / (norm * Math.sqrt(pcs.length)));
    w += tot;
  });
  return w > 0 ? Math.round((sum / w) * 100) : null;
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

/** Mine's cells: each cell's name as picked (or planted for a test), else Make's guess. */
export function cellsWithPicks(cells: ChordCell[], picks: Record<number, string>): ChordCell[] {
  return cells.map((c, i) => {
    const p = picks[i] !== undefined ? parseChord(picks[i]) : null;
    return p ? { ...c, name: p.name, root: p.root, type: p.type } : c;
  });
}

/**
 * The reading with the picks in it, ready for chordNotes (K3). The reader lets one chord sound on into
 * the next cell when both have the same name (a pad held over two bars, H3); once a pick makes them
 * differ, the event is cut at the cell's end and the next cell's chord takes over there, held for the
 * rest of that sound. Times stay the reader's (L251).
 */
export function withPicks(c: ChordsReading, picks: Record<number, string>): ChordsReading {
  const cells = cellsWithPicks(c.cells, picks);
  const sps = 60 / c.bpm / 4;
  const ev = (t: number, dur: number, cell: number, struck: boolean, vel: number): ChordEvent => {
    const raw = t / sps, step = Math.round(raw), held = dur >= 6 * sps;
    return { t: Math.round(t * 10000) / 10000, dur: Math.round(dur * 10000) / 10000, step: ((step % c.steps) + c.steps) % c.steps, off: Math.round((raw - step) * 1000) / 1000, cell, struck: struck && !held, held, vel };
  };
  const events: ChordEvent[] = [];
  for (const e of c.events) {
    const end = e.t + e.dur;
    let k = e.cell, start = e.t, cell = e.cell, first = true;
    while (cells[k + 1] && cells[k + 1].startStep * sps < end - 1e-4) {
      k++;
      if (cells[k].name === cells[cell].name) continue;
      const at = cells[k].startStep * sps;
      if (at > start + 1e-4) events.push(ev(start, at - start, cell, first && e.struck, e.vel));
      start = at; cell = k; first = false;
    }
    if (first) events.push(e);
    else events.push(ev(start, end - start, cell, false, e.vel));
  }
  return { ...c, cells, events };
}

/** A chord name over a stretch of a saved pattern (16ths from the repeat's start). */
export type ChordMark = { step: number; steps: number; name: string };

/**
 * The names to save with a folded pattern of `bars`: per half bar of the repeat, the name most of its
 * repeats play there (the first one on a tie), then a bar whose halves agree as one mark. Never overlapping.
 */
export function foldChordNames(cells: ChordCell[], bars: number): ChordMark[] {
  const P = bars * 16, halves = P / 8, votes: Map<string, number>[] = Array.from({ length: halves }, () => new Map());
  for (const c of cells) {
    if (!c.name) continue;
    for (let s = c.startStep; s < c.startStep + c.steps; s += 8) { const m = votes[Math.floor((s % P) / 8)]; m.set(c.name, (m.get(c.name) ?? 0) + 1); }
  }
  const names = votes.map((m) => [...m].reduce<[string, number] | null>((a, b) => (!a || b[1] > a[1] ? b : a), null)?.[0] ?? null);
  const out: ChordMark[] = [];
  for (let h = 0; h < halves; h += 2) {
    const a = names[h], b = names[h + 1] ?? null;
    if (a && a === b) out.push({ step: h * 8, steps: 16, name: a });
    else { if (a) out.push({ step: h * 8, steps: 8, name: a }); if (b) out.push({ step: (h + 1) * 8, steps: 8, name: b }); }
  }
  return out;
}

/** Picks that bring saved names back onto this loop's cells (by position in the repeat); only where they differ from Make's guess. */
export function picksFromSaved(cells: ChordCell[], saved: ChordMark[], bars: number): Record<number, string> {
  const P = bars * 16, out: Record<number, string> = {};
  cells.forEach((c, i) => {
    const pos = c.startStep % P, m = saved.find((x) => pos >= x.step && pos < x.step + x.steps);
    const n = m ? normalChord(m.name) : null;
    if (n && n !== c.name) out[i] = n;
  });
  return out;
}
