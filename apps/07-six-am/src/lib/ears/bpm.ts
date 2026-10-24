// Tempo helpers for Ears: pure maths, no audio. The onset autocorrelation lives in features.ts;
// this file decides between related tempi (half/double, 2:3/3:2) and names the relation.

/** The range a result is shown in: covers downtempo to drum & bass. */
export const BPM_MIN = 70;
export const BPM_MAX = 180;
/** The range candidates are searched in (a bit wider, so 70 and 180 aren't edge effects). */
export const SEARCH_MIN = 60;
export const SEARCH_MAX = 200;

/** How an alternative tempo relates to the main one: "1:2" means the alternative is half. */
export type TempoRelation = "2:1" | "1:2" | "3:2" | "2:3";
export const RELATIONS: { relation: TempoRelation; factor: number }[] = [
  { relation: "2:1", factor: 2 },
  { relation: "1:2", factor: 0.5 },
  { relation: "3:2", factor: 1.5 },
  { relation: "2:3", factor: 2 / 3 },
];

export type TempoAlternative = { bpm: number; relation: TempoRelation; ratio: number };
export type TempoPick = { bpm: number; score: number; alternative: TempoAlternative | null; ambiguous: boolean };

/** If `other` is one of the related tempi of `main` (within `tol`, relative), which one; "1:1" if equal. */
export function relationBetween(other: number, main: number, tol = 0.03): TempoRelation | "1:1" | null {
  if (!(other > 0) || !(main > 0)) return null;
  if (Math.abs(other / main - 1) <= tol) return "1:1";
  for (const r of RELATIONS) if (Math.abs(other / (main * r.factor) - 1) <= tol) return r.relation;
  return null;
}

/** The related tempi of `bpm` that fall inside [lo, hi]. */
export function relatedTempos(bpm: number, lo = SEARCH_MIN, hi = SEARCH_MAX) {
  return RELATIONS.map((r) => ({ relation: r.relation, bpm: bpm * r.factor })).filter((t) => t.bpm >= lo && t.bpm <= hi);
}

/** Halve or double until the tempo is inside [lo, hi] (61 → 122, 200 → 100). 0 stays 0. */
export function foldIntoRange(bpm: number, lo = BPM_MIN, hi = BPM_MAX) {
  if (!(bpm > 0) || !Number.isFinite(bpm)) return 0;
  let b = bpm;
  while (b < lo && b * 2 <= hi) b *= 2;
  while (b > hi && b / 2 >= lo) b /= 2;
  return b;
}

/**
 * A broad prior over tempo: log-normal centred on 128 BPM, one octave wide. It only breaks near
 * ties between related tempi (75 vs 150, 87 vs 174); it no longer drags 150 down to 100 the way
 * the old 120-centred, 0.6-octave prior did.
 */
export function tempoPrior(bpm: number) {
  return Math.exp(-0.5 * Math.pow(Math.log2(bpm / 128), 2));
}

/**
 * Pick the best tempo from a score function (higher = more periodic at that tempo) and name the
 * strongest related alternative. `ambiguous` when the alternative scores at least `ambiguity` of
 * the winner after the prior.
 */
export function pickTempo(
  score: (bpm: number) => number,
  { step = 0.25, ambiguity = 0.8, lo = SEARCH_MIN, hi = SEARCH_MAX } = {},
): TempoPick {
  const weighted = (b: number) => score(b) * tempoPrior(b);
  let best = 0, bestW = -Infinity;
  for (let b = lo; b <= hi + 1e-9; b += step) {
    const w = weighted(b);
    if (w > bestW) { bestW = w; best = b; }
  }
  if (!(bestW > 0)) return { bpm: 0, score: 0, alternative: null, ambiguous: false };

  let alternative: TempoAlternative | null = null;
  for (const t of relatedTempos(best, lo, hi)) {
    // The related peak may sit a little off the exact ratio: search ±2% around it.
    let altBpm = t.bpm, altW = -Infinity;
    for (let b = t.bpm * 0.98; b <= t.bpm * 1.02; b += step / 2) {
      const w = weighted(b);
      if (w > altW) { altW = w; altBpm = b; }
    }
    const ratio = altW / bestW;
    if (ratio > 0 && (!alternative || ratio > alternative.ratio)) alternative = { bpm: altBpm, relation: t.relation, ratio };
  }
  return { bpm: best, score: bestW, alternative, ambiguous: !!alternative && alternative.ratio >= ambiguity };
}
