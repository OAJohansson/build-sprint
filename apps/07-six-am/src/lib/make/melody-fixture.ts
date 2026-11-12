// Melody-slice regression fixture (data-evals, 12 Nov, evals-runs/2026-11-12-melody-slice.md): the hand
// labels of Lost in the Loop bars 69–76 (a G7 stab, G3 D4 B4 F5, struck on the last 16th before each
// beat, a higher voicing in bar 7), as numbers only: each event's time (ms from the loop start, the
// map's bar line) and its MIDI notes. No audio of the track is kept (C2); the grader's spectrogram was
// deleted after grading. The loop is re-rendered here with Six AM's own additive voice, shaped like
// what the grader measured: every stab rings into the next one (the pitch never fully stops), the
// reason the reader merged them into long held notes (M-F2). Bleed: the bass and a kick at −20 dB.
import { renderBassBleed, renderNotes, withBleed, type TruthNote, type Voice } from "./layers-bench";

/** Lost 69–76 at 123.02 BPM: labelled chord events [t_ms, midi…] (the grader's "chords"; ambiguous ones left out). */
export const LOST_69_76: { bpm: number; key: { key: string; scale: "major" | "minor" }; lenMs: number; chords: number[][]; ambiguous: number[][] } = {
  bpm: 123.02, key: { key: "G", scale: "major" }, lenMs: 13500,
  chords: [[9,55,62,71,77],[434,55,62,71,77],[502.9,55,62,71,77],[615.6,55,62,71,77],[928.9,55,62,71,77],[1143.4,55,62,71,76],[1410.8,55,62,71,77],[1896.7,55,62,71,77],[2385.6,55,62,71,77],[2527.3,55,62,71,77],[2861.5,55,62,71,77],[3361.4,55,62,71,77],[3554.9,55,62,71,77],[3850.2,55,62,71,77],[3936.1,55,62,71,77],[3986.9,55,62,71,77],[4076.7,55,62,77],[4345.1,55,62,71,77],[4477.8,55,62,71,77],[4825,55,62,71,77],[5306.9,55,62,71,77],[5800.8,55,62,71,77],[5956.5,55,62,71,77],[6007.3,55],[6283.7,55,62,71,77],[6775.6,55,62,71,77],[7260.5,55,62,71,77],[7484,55,62,71,77],[7747.4,55,62,71,77],[8230.3,55,62,71,77],[8432.8,55,62,71,77],[8726.2,55,62,71,77],[8930.7,55,62,71,77],[9214.1,55,62,71,77],[9346.8,55,62,71,77],[9397.6,55,62,71,77],[9702,55,62,71,77],[10178.9,55,62,71,77],[10373.4,55,62,71,77],[10677.7,55,62,71,77],[10755.6,55,62,71,77],[10888.3,55,62,71,77],[11164.6,55,71,74,77,81],[11246.4,55,62,71,77],[11307.3,55,62,71,74,77],[11358.2,55,62,71,74,77,79],[11652.5,55,71,74,77,81],[11837.1,55,71,74,77,79,81],[12139.4,71,74,77,79,81],[12303,71,74,77,79,81],[12627.3,71,74,77,81],[12821.9,71,74,77,79,81],[13114.2,71,74,77,79,81],[13206,71,74,77,79,81],[13276.8,71,74,77,79,81]],
  ambiguous: [[318.3,55,62,71],[763.3,55,62,71],[1251.2,55,62,71],[1797.9,55,62,71,77],[2140.1,55,62],[2284.8,55,62,71,77],[3102.9,55,62,71,77],[3220.7,55,62,71],[3696.6,55,62],[4210.4,55,62,71,77],[6146,55,62,71],[6520.2,55,62],[7012.1,55,62],[8502.7,55,62,71],[8557.6,55,62,71],[9006.5,55,62,71],[10082.1,55,62,71,77],[10551,55,62,71,77],[11418,55,71],[11539.8,71,74,77,79,81],[12893.7,71,74,77]],
};

/** A stab that rings: a hard attack, a short decay onto a held level, held until the next stab. */
export const RINGING_STAB: Voice = { harmonics: 12, tilt: 1.1, attack: 0.003, decay: 0.09, sustain: 0.35, release: 0.12 };

/**
 * The labelled loop rendered: every event (labelled and ambiguous ones, so the stab rhythm is whole),
 * each held until the next event starts. Truth = the labelled chords only (the grader's scope).
 */
export function renderLost6976(rate = 22050, seed = 1): { mono: Float32Array; truth: TruthNote[]; bpm: number } {
  const L = LOST_69_76, n = Math.round((L.lenMs / 1000 + 0.6) * rate);
  const all = [...L.chords.map((c) => ({ c, label: true })), ...L.ambiguous.map((c) => ({ c, label: false }))].sort((a, b) => a.c[0] - b.c[0]);
  const notes: TruthNote[] = [], truth: TruthNote[] = [];
  all.forEach(({ c, label }, i) => {
    const t = c[0] / 1000, next = (all[i + 1]?.c[0] ?? L.lenMs + 300) / 1000;
    for (const midi of c.slice(1)) {
      const note = { t, dur: Math.max(0.05, next - t), midi, vel: label ? 1 : 0.6 };
      notes.push(note);
      if (label && t * 1000 <= L.lenMs) truth.push(note);
    }
  });
  const part = renderNotes(notes, RINGING_STAB, n, rate, 0.12);
  const bass = renderBassBleed(L.bpm, n, rate, [31, 31, 31, 31]);
  return { mono: withBleed(part, [bass], -20, seed), truth, bpm: L.bpm };
}
