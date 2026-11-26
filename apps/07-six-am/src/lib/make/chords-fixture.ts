// Chord-name regression fixtures (L256 fix round): per-16th harmony shaped like the loops of the
// spike's real-track grade (evals-runs/2026-11-26-chords-spike.md), from its labels and its failure
// notes (CH-1, CH-2, CH-5), as numbers only. The grader's spectra were deleted (C2), so the LEVELS
// here are the engineer's model of what the report describes (a quiet 7th, a loud 9th, a pad under
// stabs, a pad change mid-bar), not measured. Regression guards only: the reader is graded on the real
// separated parts by data-evals. The held-out loop (Dubspinna 73–80) is not here and must never be.
import type { ChordType, ChordCell, StepHarmony } from "./chords-read";

/** A sounding tone: MIDI, amplitude at its steps (linear, as the note reader's), and the steps it sounds on (with a decay after a strike). */
type Tone = { midi: number; amp: number };
type Hit = { step: number; tones: Tone[]; ring?: number; decay?: number };
type Pad = { from: number; to: number; tones: Tone[] };
export type Label = { startStep: number; steps: number; root: number; type: ChordType | "?" };
export type ChordFixture = { name: string; bars: number; key: { key: string; scale: "major" | "minor" }; harmony: StepHarmony; labels: Label[] };

const FAMILY: Record<ChordType, string> = { maj: "maj", maj7: "maj", min: "min", m7: "min", "7": "dom", sus2: "sus", sus4: "sus", dim: "dim" };
export const familyOf = (t: ChordType) => FAMILY[t];

/** A tiny seeded random (the fixtures are fixed). */
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

/**
 * Per-16th harmony as harmonyOf makes it: each step's sounding tones add √amp to their pitch class,
 * amp² to the energy, and the lowest tone within 0.3 of the step's loudest adds √amp to the bass;
 * `struck` is 1 on a step with a strike. Plus a noise floor on every pitch class.
 */
function build(bars: number, hits: Hit[], pads: Pad[], seed: number, noise = 0.03): StepHarmony {
  const steps = bars * 16, rand = rng(seed);
  const at: Tone[][] = Array.from({ length: steps }, () => []);
  const struck = new Array(steps).fill(0);
  for (const h of hits) {
    const ring = h.ring ?? 3, decay = h.decay ?? 0.5;
    struck[h.step % steps] = 1;
    for (let k = 0; k <= ring; k++) for (const t of h.tones) at[(h.step + k) % steps].push({ midi: t.midi, amp: t.amp * Math.pow(decay, k) });
  }
  for (const p of pads) for (let s = p.from; s < p.to; s++) for (const t of p.tones) at[s % steps].push(t);
  const chroma: number[][] = [], bass: number[][] = [], energy: number[] = [];
  for (let s = 0; s < steps; s++) {
    // Two ~23 ms frames per sample point would add up the same way; one per step keeps it readable.
    const c = new Array(12).fill(0).map(() => noise * rand()), b = new Array(12).fill(0);
    let e = 0, top = 0;
    for (const t of at[s]) { c[t.midi % 12] += Math.sqrt(t.amp); e += t.amp * t.amp; top = Math.max(top, t.amp); }
    const low = at[s].filter((t) => t.amp >= 0.3 * top).sort((p, q) => p.midi - q.midi)[0];
    if (low) b[low.midi % 12] += Math.sqrt(low.amp);
    chroma.push(c); bass.push(b); energy.push(e + 1e-6);
  }
  return { chroma, bass, energy, struck };
}

const T = (midis: number[], amps: number[]): Tone[] => midis.map((midi, i) => ({ midi, amp: amps[i] ?? amps[amps.length - 1] }));
const bar = (b: number, s = 0) => b * 16 + s;

/** Lost 69–76: G7 stabs (G3 D4 B4 F5) on the last 16th before each beat, the F the quietest, an A (the 9th) from the upper voicing; bar 8 higher (ambiguous). */
function lost6976(): ChordFixture {
  const hits: Hit[] = [];
  for (let b = 0; b < 8; b++) for (const s of [3, 7, 11, 15]) {
    const tones = b < 7 ? T([55, 62, 71, 77, 69], [1, 0.8, 0.6, 0.18, 0.08]) : T([71, 74, 77, 79, 81], [0.6, 0.8, 0.4, 0.5, 0.5]);
    hits.push({ step: bar(b, s), tones, ring: 3, decay: 0.55 });
  }
  const labels: Label[] = Array.from({ length: 7 }, (_, b) => ({ startStep: bar(b), steps: 16, root: 7, type: "7" as const }));
  return { name: "lost-69-76", bars: 8, key: { key: "G", scale: "major" }, harmony: build(8, hits, [], 6976), labels };
}

/** Lost 77–84: G–B♭ dyad calls (lowest G, a minor third, no fifth), labelled Gm on bars 1, 3, 5, 7, 8; other bars answer with a D–F dyad. */
function lost7784(): ChordFixture {
  const hits: Hit[] = [];
  for (let b = 0; b < 8; b++) {
    const gm = b % 2 === 0 || b === 7;
    for (const s of [0, 8]) hits.push({ step: bar(b, s), tones: gm ? T([55, 58, 62], [1, 0.7, 0.04]) : T([62, 65, 58], [0.8, 0.6, 0.2]), ring: 5, decay: 0.6 });
  }
  const labels: Label[] = [0, 2, 4, 6, 7].map((b) => ({ startStep: bar(b), steps: 16, root: 7, type: "min" as const }));
  return { name: "lost-77-84", bars: 8, key: { key: "G", scale: "major" }, harmony: build(8, hits, [], 7784), labels };
}

/**
 * Lost 49–56: a pad-and-stab bar set. Cm (bar 1), D7 (bar 2, stabbed late in the bar and at bar 3's
 * start), then a quiet Gm pad from bar 3's second half (CH-5: D7 then Gm in bar 3), Gm pad to the end.
 */
function lost4956(): ChordFixture {
  const hits: Hit[] = [
    { step: bar(0, 0), tones: T([48, 51, 55, 60], [1, 0.7, 0.8, 0.5]), ring: 10, decay: 0.8 },
    { step: bar(1, 11), tones: T([50, 54, 57, 60], [1, 0.7, 0.8, 0.45]), ring: 4, decay: 0.7 },
    { step: bar(2, 0), tones: T([50, 54, 57, 60], [1, 0.7, 0.8, 0.45]), ring: 7, decay: 0.75 },
  ];
  const pads: Pad[] = [
    { from: bar(0, 0), to: bar(1, 0), tones: T([48, 55, 63], [0.08, 0.08, 0.06]) },
    { from: bar(1, 0), to: bar(2, 8), tones: T([50, 57, 66], [0.06, 0.06, 0.05]) },
    { from: bar(2, 8), to: bar(8, 0), tones: T([55, 58, 62], [0.1, 0.08, 0.09]) },
  ];
  const labels: Label[] = [
    { startStep: bar(0), steps: 16, root: 0, type: "min" },
    { startStep: bar(1), steps: 16, root: 2, type: "7" },
    { startStep: bar(2), steps: 8, root: 2, type: "7" },
    { startStep: bar(2, 8), steps: 8, root: 7, type: "min" },
    { startStep: bar(7), steps: 8, root: 7, type: "min" },
  ];
  return { name: "lost-49-56", bars: 8, key: { key: "G", scale: "major" }, harmony: build(8, hits, pads, 4956), labels };
}

/**
 * Retrouvé 57–64 (CH-2): F4 A♭4 C5 stabs twice a bar, a pad's D♭ (D♭3, low, quiet) under every step,
 * single G5 hits between the stabs. Bars 4–7 labelled Fm; the map's key is A♯ major.
 */
function ret5764(): ChordFixture {
  const hits: Hit[] = [];
  for (let b = 0; b < 8; b++) {
    for (const s of [2, 10]) hits.push({ step: bar(b, s), tones: T([65, 68, 72], [1, 0.75, 0.8]), ring: 2, decay: 0.45 });
    for (const s of [6, 14]) hits.push({ step: bar(b, s), tones: T([79], [0.55]), ring: 1, decay: 0.4 });
  }
  const pads: Pad[] = [{ from: 0, to: bar(8), tones: T([49, 61], [0.06, 0.04]) }];
  const labels: Label[] = [3, 4, 5, 6].map((b) => ({ startStep: bar(b), steps: 16, root: 5, type: "min" as const }));
  return { name: "ret-57-64", bars: 8, key: { key: "A#", scale: "major" }, harmony: build(8, hits, pads, 5764), labels };
}

const DB = T([61, 65, 68, 63], [1, 0.7, 0.7, 0.3]); // D♭ with a loud 9th (E♭)
const EB = T([63, 67, 70, 65], [1, 0.7, 0.7, 0.3]); // E♭ with its 9th (F)
const BBM = T([58, 61, 65, 60], [1, 0.25, 0.8, 0.45]); // B♭m: the D♭ quiet, the C (9th) loud (CH-1)

/** Dubspinna 57–64: the Fatima Yamaha loop as plucks, D♭ (bars 1, 5), B♭m (3, 4, 7); bars 2, 6, 8 ambiguous (E♭ here). */
function dub5764(): ChordFixture {
  const prog = [DB, EB, BBM, BBM, DB, EB, BBM, BBM];
  const hits: Hit[] = [];
  prog.forEach((tones, b) => { for (const s of [0, 3, 6, 10]) hits.push({ step: bar(b, s), tones, ring: 2, decay: 0.5 }); });
  const labels: Label[] = [[0, 1, "maj"], [2, 10, "min"], [3, 10, "min"], [4, 1, "maj"], [6, 10, "min"]].map(([b, root, type]) => ({ startStep: bar(b as number), steps: 16, root: root as number, type: type as ChordType }));
  return { name: "dub-57-64", bars: 8, key: { key: "G#", scale: "major" }, harmony: build(8, hits, [], 5764 + 1), labels };
}

/** Dubspinna 141–148: half-bar changes, D♭ | E♭ (bars 1, 5), B♭m (3, 7), … | D♭ (4, 8); the B♭? halves count for root only. */
function dub141148(): ChordFixture {
  const halves = [[DB, EB], [BBM, BBM], [BBM, BBM], [BBM, DB], [DB, EB], [BBM, BBM], [BBM, BBM], [BBM, DB]];
  const hits: Hit[] = [];
  halves.forEach(([a, b2], b) => { for (const s of [0, 3, 6]) hits.push({ step: bar(b, s), tones: a, ring: 1, decay: 0.5 }); for (const s of [8, 11, 14]) hits.push({ step: bar(b, s), tones: b2, ring: 1, decay: 0.5 }); });
  const L = (b: number, h: number, root: number, type: ChordType | "?"): Label => ({ startStep: bar(b, h * 8), steps: h < 0 ? 16 : 8, root, type });
  const labels: Label[] = [
    L(0, 0, 1, "maj"), L(0, 1, 3, "maj"), L(1, 1, 10, "?"), { startStep: bar(2), steps: 16, root: 10, type: "min" }, L(3, 1, 1, "maj"),
    L(4, 0, 1, "maj"), L(4, 1, 3, "maj"), L(5, 1, 10, "?"), { startStep: bar(6), steps: 16, root: 10, type: "min" }, L(7, 1, 1, "maj"),
  ];
  return { name: "dub-141-148", bars: 8, key: { key: "G#", scale: "major" }, harmony: build(8, hits, [], 141148), labels };
}

/** Dubspinna 105–112: B♭m plucks under the lead line (G B♭ C A♭ G E♭ F, octave-doubled, as loud as the plucks); B♭m on bars 3, 4a, 7, 8a. */
function dub105112(): ChordFixture {
  const hits: Hit[] = [];
  for (let b = 0; b < 8; b++) for (const s of [0, 6, 10]) hits.push({ step: bar(b, s), tones: BBM, ring: 2, decay: 0.5 });
  const line = [[1, 7], [4, 10], [5, 0], [6, 8], [8, 7], [12, 3], [13, 5]];
  for (const b of [0, 2, 4, 6]) for (const [s, pc] of line) hits.push({ step: bar(b, s), tones: T([72 + pc, 84 + pc], [0.5, 0.3]), ring: 1, decay: 0.5 });
  const labels: Label[] = [
    { startStep: bar(2), steps: 16, root: 10, type: "min" }, { startStep: bar(3), steps: 8, root: 10, type: "min" },
    { startStep: bar(6), steps: 16, root: 10, type: "min" }, { startStep: bar(7), steps: 8, root: 10, type: "min" },
  ];
  return { name: "dub-105-112", bars: 8, key: { key: "G#", scale: "major" }, harmony: build(8, hits, [], 105112), labels };
}

export const CHORD_FIXTURES: ChordFixture[] = [lost6976(), lost7784(), lost4956(), ret5764(), dub5764(), dub141148(), dub105112()];

/**
 * The spike grade's scoring on cells (evals-runs/2026-11-26-chords-spike.md): per labelled cell, each
 * reader cell counts by its share of it; root + family (maj/maj7, m/m7, 7, sus, dim), root alone,
 * and H5 (the label in the guess or its first 3 alternatives). "?" labels count for root only.
 */
export function scoreCells(cells: ChordCell[], labels: Label[]) {
  let fam = 0, famN = 0, root = 0, top4 = 0;
  for (const l of labels) {
    let f = 0, r = 0, t4 = 0;
    for (const c of cells) {
      const ov = Math.min(l.startStep + l.steps, c.startStep + c.steps) - Math.max(l.startStep, c.startStep);
      if (ov <= 0) continue;
      const w = ov / l.steps;
      if (c.root === l.root) r += w;
      if (l.type === "?") continue;
      const lt = l.type;
      const hit = (root_: number | null, t: ChordType | null) => root_ === l.root && !!t && familyOf(t) === familyOf(lt);
      if (hit(c.root, c.type)) f += w;
      if (hit(c.root, c.type) || c.alternatives.slice(0, 3).some((g) => hit(g.root, g.type))) t4 += w;
    }
    root += r;
    if (l.type !== "?") { fam += f; top4 += t4; famN++; }
  }
  return { family: famN ? fam / famN : 1, root: labels.length ? root / labels.length : 1, top4: famN ? top4 / famN : 1, famN, n: labels.length };
}
