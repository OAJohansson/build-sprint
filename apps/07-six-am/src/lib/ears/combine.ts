// Combine per-snippet statistics into one track result (L26: 4 × 30 s across the track).
// Pure: runs in the worker (it has the class names) and in Node for checks.
import { keyFromChroma, rankKeys, tempoFromAcf, topFromMean } from "./features";
import type { EarsCombined, EarsSnippetStats } from "./types";

/** Frame-weighted mean of normalised onset autocorrelations; null if none usable. */
export function combineAcfs(list: { acf: number[] | null; frames: number }[]): number[] | null {
  const usable = list.filter((s): s is { acf: number[]; frames: number } => !!s.acf && s.frames > 0);
  if (!usable.length) return null;
  const len = Math.min(...usable.map((s) => s.acf.length));
  const total = usable.reduce((t, s) => t + s.frames, 0);
  const out = new Array<number>(len).fill(0);
  for (const s of usable) for (let i = 0; i < len; i++) out[i] += (s.acf[i] * s.frames) / total;
  return out;
}

export function combineSnippets(snippets: EarsSnippetStats[], classes: string[]): EarsCombined {
  const patches = snippets.reduce((t, s) => t + s.patches, 0);
  const seconds = snippets.reduce((t, s) => t + s.seconds, 0);
  // Styles: patch-weighted mean of each snippet's mean activations = mean over all patches.
  const mean = new Array<number>(classes.length).fill(0);
  for (const s of snippets) for (let c = 0; c < classes.length; c++) mean[c] += (s.meanActivations[c] ?? 0) * (s.patches / Math.max(1, patches));
  const styles = topFromMean(mean, classes, 5);

  const bpm = tempoFromAcf(combineAcfs(snippets));
  const chroma = new Array<number>(12).fill(0);
  for (const s of snippets) for (let i = 0; i < 12; i++) chroma[i] += s.chroma[i] ?? 0;
  const key = keyFromChroma(chroma);
  const runnerUp = rankKeys(chroma).find((k) => k.key !== key.key || k.scale !== key.scale) ?? null;

  const samples = snippets.reduce((t, s) => t + s.samples, 0);
  const rms = Math.sqrt(snippets.reduce((t, s) => t + s.sumSquares, 0) / Math.max(1, samples));
  const dbfs = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  // shortcut: brightness is the seconds-weighted mean of per-snippet median centroids, not a
  // median over all frames; close enough for a label, upgrade if data-evals flags it.
  const centroidHz = snippets.reduce((t, s) => t + s.centroidHz * s.seconds, 0) / Math.max(1e-9, seconds);

  return {
    seconds: Math.round(seconds * 10) / 10,
    patches,
    styles: styles.top,
    activations: { count: classes.length, finite: styles.finite },
    bpm: bpm.bpm,
    bpmConfidence: bpm.confidence,
    bpmAlternative: bpm.alternative,
    bpmAmbiguous: bpm.ambiguous,
    key: key.key,
    scale: key.scale,
    keyStrength: key.strength,
    keyRunnerUp: runnerUp,
    energy: { rms: Math.round(rms * 10000) / 10000, dbfs: Math.round(dbfs * 10) / 10 },
    brightness: { centroidHz: Math.round(centroidHz) },
  };
}
