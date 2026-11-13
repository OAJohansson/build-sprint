// Melody note reading with Spotify's Basic Pitch (L245, a time-boxed try): a small polyphonic note
// model (Apache-2.0, @spotify/basic-pitch 1.0.1 on TensorFlow.js 3.21), run in Make's worker on a copy
// of the looped "other" part (C2: read in memory, the copy zeroed after, never stored or sent). The
// model is served from the app's own public folder and fetched only when Melody reads a loop. Its
// notes go out as the same NotesReading the DSP reader (notes-read.ts) gives, so the Chords/Lead split,
// the key filter and the doubtful rules apply to both; MELODY_READER (melody-reader.ts) picks one.
import type { GraphModel } from "@tensorflow/tfjs";
import { inScale, pitchClass, type Scale } from "@/lib/synths/theory";
import { toMono } from "./dsp";
import type { NotesReading, ReadNote } from "./notes-read";

/** What Basic Pitch listens at: 22,050 Hz mono. */
export const BP_RATE = 22050;
/** Where the browser fetches the model (public/models/basic-pitch, 917 KB). */
export const BP_MODEL_URL = "/models/basic-pitch/model.json";

// shortcut: note thresholds (onset 0.6, frame 0.4, ≥ 70 ms, a quiet out-of-key note dropped) picked on the melody fixture and the spike's bench; tune on the real part's grade.
export const BP_OPT = { onset: 0.6, frame: 0.4, minFrames: 6, lowMidi: 40, highMidi: 96, outOfKeyShare: 0.3 };

/** Windowed-sinc resampling to `to` Hz (a low-pass at 0.45 of the lower rate first, so nothing folds). */
export function resample(x: Float32Array, rate: number, to = BP_RATE): Float32Array {
  if (rate === to) return x;
  const ratio = to / rate, n = Math.floor(x.length * ratio), out = new Float32Array(n);
  const fc = 0.45 * Math.min(1, ratio), half = 16 / Math.min(1, ratio);
  for (let i = 0; i < n; i++) {
    const c = i / ratio, a = Math.max(0, Math.ceil(c - half)), b = Math.min(x.length - 1, Math.floor(c + half));
    let s = 0, w = 0;
    for (let j = a; j <= b; j++) {
      const t = j - c, sinc = t === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * t) / (Math.PI * t);
      const win = 0.5 + 0.5 * Math.cos((Math.PI * t) / half);
      s += x[j] * sinc * win; w += sinc * win;
    }
    out[i] = w ? s / w : 0;
  }
  return out;
}

/**
 * Reads a looped pitched part with Basic Pitch: notes with several at once, as NotesReading. `model`:
 * the loaded graph model (the browser fetches BP_MODEL_URL; tests load it from disk).
 */
export async function readNotesBP(left: Float32Array, right: Float32Array | undefined, rate: number, bpm: number, model: GraphModel | Promise<GraphModel>, key?: { key: string; scale: Scale }, loopStartSec = 0): Promise<NotesReading> {
  const mono = resample(toMono(left, right), rate, BP_RATE);
  if (mono.length < BP_RATE * 0.5) return { notes: [], tuningCents: 0 };
  const { BasicPitch, outputToNotesPoly, noteFramesToTime } = await import("@spotify/basic-pitch");
  const tf = await import("@tensorflow/tfjs");
  const bp = new BasicPitch(Promise.resolve(model));
  const frames: number[][] = [], onsets: number[][] = [], contours: number[][] = [];
  // Basic Pitch leaves ~15 MB of tensors behind per read; a scope disposes them (the model's own weights,
  // made before it, stay), so the worker doesn't grow with every loop read.
  tf.engine().startScope();
  try {
    await bp.evaluateModel(mono, (f, o, c) => { frames.push(...f); onsets.push(...o); contours.push(...c); }, () => {});
  } finally {
    tf.engine().endScope();
  }
  const events = noteFramesToTime(outputToNotesPoly(frames, onsets, BP_OPT.onset, BP_OPT.frame, BP_OPT.minFrames));
  mono.fill(0); // the resampled copy of the original goes here too (C2)
  const sps = 60 / bpm / 4, tonic = key ? pitchClass(key.key) : null;
  const loud = Math.max(1e-9, ...events.map((e) => e.amplitude));
  const notes: ReadNote[] = [];
  for (const e of events) {
    const midi = e.pitchMidi, t = e.startTimeSeconds, vel = Math.round(Math.min(1, e.amplitude / loud) * 100) / 100;
    if (midi < BP_OPT.lowMidi || midi > BP_OPT.highMidi) continue; // the bass's bleed under, nothing past C7
    // As the DSP reader: a quiet note outside the track's key is a leftover, not a note.
    if (tonic !== null && !inScale(midi, tonic, key!.scale) && vel < BP_OPT.outOfKeyShare) continue;
    const step = Math.round((t - loopStartSec) / sps);
    notes.push({ t, dur: Math.max(0.03, e.durationSeconds), midi, vel, step, offsetMs: Math.round((t - loopStartSec - step * sps) * 10000) / 10 });
  }
  notes.sort((p, q) => p.t - q.t || p.midi - q.midi);
  return { notes, tuningCents: 0 };
}
