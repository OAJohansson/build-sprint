// Shared Ears types: what crosses the worker boundary and what gets stored. Numbers only, never audio.
import type { TempoRelation } from "./bpm";

export type BpmAlternative = { bpm: number; relation: TempoRelation; ratio: number };

/** Reduced statistics of one snippet: enough to combine snippets without keeping their audio. */
export type EarsSnippetStats = {
  seconds: number;
  frames: number;
  patches: number;
  /** Normalised onset autocorrelation (bpm), null if under 4 s. */
  acf: number[] | null;
  /** 12-bin peak chroma, summed over frames (key). */
  chroma: number[];
  sumSquares: number;
  samples: number;
  centroidHz: number;
  /** Mean of the 400 sigmoid style activations over the snippet's patches. */
  meanActivations: number[];
};

/** One analysed stretch of audio (a snippet, or the spike's single window). */
export type EarsResult = {
  seconds: number;
  patches: number;
  timings: { featuresMs: number; inferenceMs: number };
  styles: { style: string; pct: number }[];
  activations: { count: number; finite: boolean };
  bpm: number;
  bpmConfidence: number;
  bpmAlternative: BpmAlternative | null;
  bpmAmbiguous: boolean;
  key: string;
  scale: string;
  keyStrength: number;
  /** Second-best key (combined results only; older stored results don't have it). */
  keyRunnerUp?: { key: string; scale: string; strength: number } | null;
  energy: { rms: number; dbfs: number };
  brightness: { centroidHz: number };
  stats: EarsSnippetStats;
};

/** Several snippets combined into one track result. */
export type EarsCombined = Omit<EarsResult, "timings" | "stats">;

export type EarsModelInfo = { loadMs: number; bytes: number; inputName: string; outputNames: string[]; classes: number };

export type EarsRequest =
  | { type: "load" }
  | { type: "analyse"; id: number; pcm: Float32Array; sampleRate: number }
  | { type: "combine"; id: number; snippets: EarsSnippetStats[] };

export type EarsResponse =
  | { type: "progress"; loaded: number; total: number }
  | { type: "loaded"; info: EarsModelInfo }
  | { type: "result"; id: number; result: EarsResult }
  | { type: "combined"; id: number; result: EarsCombined }
  | { type: "error"; id?: number; message: string };
