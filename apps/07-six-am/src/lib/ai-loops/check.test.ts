import { describe, expect, it } from "vitest";
import { checkLoop, keyMatches } from "./check";

// Synthetic sine bass lines in a known key and tempo: one plucked note per beat (fast attack,
// exponential decay), root-heavy like a club bassline.
const SR = 44100;
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function bassLine(bpm: number, bars: number, midiNotes: number[]): Float32Array {
  const beat = (60 / bpm) * SR;
  const out = new Float32Array(Math.round(bars * 4 * beat));
  for (let b = 0; b < bars * 4; b++) {
    const f = hz(midiNotes[b % midiNotes.length]);
    const start = Math.round(b * beat), len = Math.round(beat * 0.9);
    for (let i = 0; i < len && start + i < out.length; i++) {
      const t = i / SR;
      out[start + i] += 0.6 * Math.min(1, i / 40) * Math.exp(-t * 6) * Math.sin(2 * Math.PI * f * t);
    }
  }
  return out;
}

// A minor: A1 A1 C2 E2 | A1 G1 E2 D2 (MIDI 33 = A1)
const A_MINOR = [33, 33, 36, 40, 33, 31, 40, 38];
// F major: F1 F1 A1 C2 | F1 E1 C2 G1 (MIDI 29 = F1)
const F_MAJOR = [29, 29, 33, 36, 29, 28, 36, 31];

describe("checkLoop", () => {
  it("passes an A minor line at 124 BPM asked for as A minor (and C major, its relative)", () => {
    const pcm = bassLine(124, 8, A_MINOR);
    const m = checkLoop(pcm, SR, { bpm: 124, key: "A", scale: "minor" });
    expect(Math.abs(m.bpm - 124)).toBeLessThanOrEqual(1);
    expect(m.onTempo).toBe(true);
    expect(m.inKey).toBe(true);
    expect(checkLoop(pcm, SR, { bpm: 124, key: "C", scale: "major" }).inKey).toBe(true);
  });

  it("passes an F major line at 128 BPM", () => {
    const m = checkLoop(bassLine(128, 8, F_MAJOR), SR, { bpm: 128, key: "F", scale: "major" });
    expect(m).toMatchObject({ onTempo: true, inKey: true });
  });

  it("fails the wrong key and a tempo that's 3:2 or half the request", () => {
    const pcm = bassLine(124, 8, A_MINOR);
    expect(checkLoop(pcm, SR, { bpm: 124, key: "D#", scale: "minor" }).inKey).toBe(false);
    expect(checkLoop(pcm, SR, { bpm: 124 * 1.5, key: "A", scale: "minor" }).onTempo).toBe(false);
    expect(checkLoop(pcm, SR, { bpm: 62, key: "A", scale: "minor" }).onTempo).toBe(false);
  });
});

describe("keyMatches", () => {
  it("accepts same and relative keys only", () => {
    expect(keyMatches({ key: "A", scale: "minor" }, { key: "A", scale: "minor" })).toBe(true);
    expect(keyMatches({ key: "A", scale: "minor" }, { key: "C", scale: "major" })).toBe(true);
    expect(keyMatches({ key: "D#", scale: "minor" }, { key: "F#", scale: "major" })).toBe(true);
    expect(keyMatches({ key: "Eb", scale: "minor" }, { key: "D#", scale: "minor" })).toBe(true);
    expect(keyMatches({ key: "A", scale: "minor" }, { key: "A", scale: "major" })).toBe(false); // parallel
    expect(keyMatches({ key: "F", scale: "minor" }, { key: "C", scale: "major" })).toBe(false); // fifth
  });
});
