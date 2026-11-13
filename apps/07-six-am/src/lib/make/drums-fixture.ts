// Drums-slice regression fixture (data-evals, 28 Oct, evals-runs/2026-10-28-drums-slice.md): the hand
// labels of 4 real loops (Mason Flint's remix of It Just Won't Do at 126.05 BPM, Cărbune's Lost in the
// Loop at 123.02 BPM), as numbers only: which 16th each row plays per bar, where the beat sits against
// the map's bar line, and the tempo. No audio of the tracks is kept (C2); the grader's envelopes were
// deleted after grading. The loops are re-rendered here with Six AM's own bench kits, shaped like what
// the grader measured on the separated parts:
// - Mason: a kick whose pitch falls slowly from high up (its 30–120 Hz energy peaks 15–50 ms after the
//   attack, D-F1), metallic open hats on the offbeat with real 1–3 kHz energy (D-F2), and a beat
//   69 ms after the bar line on 81–88, near the half-16th fold (D-F3).
// - Lost: a faster kick sweep, and a beat 1.4–1.5 sixteenths after the map's bar line (D-F3).
// - Mason 57–64: a breakdown going into a build, hats over a rising low noise wash (D-F6).
// Steps below are on the beat grid (kick on beat 1 = step 0); the write-up's columns are on the
// reader's grid of that read, so Mason 81–88 and both Lost loops are shifted here by their grid.
import { DRUM_ROWS, rng, withBleed, renderBassBleed, renderDrums, type BarPattern, type DrumSpec, type Kit, type TruthHit } from "./layers-bench";

export const KIT_MASON: Kit = { kickHz: [420, 52], kickDecay: 0.42, kickSweepS: 0.028, clap: "clap", clapHz: 1500, hatHp: 2500, openHat: true, hatMetal: true, openTau: 0.15 };
export const KIT_LOST: Kit = { kickHz: [260, 50], kickDecay: 0.35, kickSweepS: 0.018, clap: "clap", clapHz: 1300, hatHp: 6500, openHat: false };

const bars8 = (f: (bar: number) => BarPattern) => Array.from({ length: 8 }, (_, b) => f(b));

/** The labelled loops: name, tempo, kit, where beat 1 sits after the loop's first sample (ms), the bars. */
export const REAL_LABELLED: (DrumSpec & { readerGridMs: number })[] = [
  // Mason 17–24 (grid 22 ms): kick 0,4,8,12; 15 in bars 1,3,5,7; 14 in bar 4; clap 4,12; open hats 2,6,10,14.
  { name: "Mason 17–24", bpm: 126.05, kit: KIT_MASON, gridOffsetMs: 22, readerGridMs: 22, openHatSteps: [2, 6, 10, 14],
    bars: bars8((b) => ({ kick: [0, 4, 8, 12, ...(b % 2 === 0 ? [15] : []), ...(b === 3 ? [14] : [])], clap: [4, 12], hats: [2, 6, 10, 14] })) },
  // Mason 81–88 (read at −49.6 ms: kick 1,5,9,13; 0 in bars 2,4,6,8; 15 in bars 4,8; clap 5,13; hats 3,7,11,15).
  { name: "Mason 81–88", bpm: 126.05, kit: KIT_MASON, gridOffsetMs: 69.4, readerGridMs: -49.6, openHatSteps: [2, 6, 10, 14],
    bars: bars8((b) => ({ kick: [0, 4, 8, 12, ...(b % 2 === 0 ? [15] : []), ...(b === 3 || b === 7 ? [14] : [])], clap: [4, 12], hats: [2, 6, 10, 14] })) },
  // Lost 21–28 (read at 50.2 ms: kick 1,5,9,13; clap 1,9; hats 3,7,11,15).
  { name: "Lost 21–28", bpm: 123.02, kit: KIT_LOST, gridOffsetMs: 172.2, readerGridMs: 50.2,
    bars: bars8(() => ({ kick: [0, 4, 8, 12], clap: [0, 8], hats: [2, 6, 10, 14] })) },
  // Lost 85–92 (read at −55.4 ms: kick 2,6,10,14; clap 2,10; hats 0 (bars 2–8), 4, 8, 12, and quieter ones at 5.26, 13.26).
  { name: "Lost 85–92", bpm: 123.02, kit: KIT_LOST, gridOffsetMs: 188.5, readerGridMs: -55.4,
    bars: bars8(() => ({ kick: [0, 4, 8, 12], clap: [0, 8], hats: [2, 6, 10, 14, [3, 0.5, 0.26], [11, 0.5, 0.26]] })) },
];

/**
 * D-R1 (re-grade 12 Nov): on the real Lost 21–28 the clap is flammed, its first 1–3 kHz burst 10–13 ms
 * before the kick, and the reader timed it 8–13 ms late. This guard plays that shape (the clap −0.1 of a
 * 16th, ≈ 12 ms, before its kick) and checks claps are timed at their first burst. The bench's sounds
 * do NOT reproduce the real lateness (synthetic flams read on time before the fix too), so this is a
 * guard, not a reproduction; the real check is data-evals' re-grade on the track.
 */
export const LOST_FLAM: DrumSpec = { ...REAL_LABELLED[2], name: "Lost 21–28, flammed clap", bars: bars8(() => ({ kick: [0, 4, 8, 12], clap: [[0, 1, -0.1], [8, 1, -0.1]], hats: [2, 6, 10, 14] })) };

/** A labelled loop rendered, with the bass bled in at −20 dB as the Lab's separation leaves it. */
export function renderLabelled(spec: DrumSpec, seed = 1, rate = 44100) {
  const { mono, truth } = renderDrums(spec, { bars: 8, rate, seed });
  const bass = renderBassBleed(spec.bpm, mono.length, rate, [43, 46, 41, 38]);
  return { mono: withBleed(mono, [bass], -20, seed + 100), truth };
}

/**
 * Mason 57–64: a breakdown into a build. Hats on the 8ths, and under them a low noise wash that rises
 * over the 8 bars with slow swells (the grader read 46 faint kicks in it). Truth: hats only.
 */
export function renderNoiseBuild(seed = 1, rate = 44100): { mono: Float32Array; truth: TruthHit[]; bpm: number } {
  const bpm = 126.05;
  const spec: DrumSpec = { name: "Mason 57–64 (build)", bpm, kit: KIT_MASON, gridOffsetMs: 22, bars: [{ hats: [0, 2, 4, 6, 8, 10, 12, 14] }] };
  const { mono, truth } = renderDrums(spec, { bars: 8, rate, seed });
  const r = rng(seed + 7), n = mono.length;
  // Low-passed noise (two one-poles at ~150 Hz) whose level rises 20 dB over the loop, with swells.
  let a = 0, b = 0;
  const c = Math.exp((-2 * Math.PI * 150) / rate);
  for (let i = 0; i < n; i++) {
    a = (1 - c) * (r() * 2 - 1) + c * a; b = (1 - c) * a + c * b;
    const t = i / n, swell = 0.7 + 0.3 * Math.sin(2 * Math.PI * (t * 11 + 0.3 * Math.sin(t * 23)));
    mono[i] += b * 14 * Math.pow(10, (-20 + 20 * t) / 20) * swell;
  }
  return { mono, truth, bpm };
}

export { DRUM_ROWS };
