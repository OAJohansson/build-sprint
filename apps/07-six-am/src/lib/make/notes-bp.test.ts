// L245: Basic Pitch on the Lost 69–76 fixture (the real labels re-rendered, melody-fixture.ts) against
// the Z3 bars, plus MR-1 (struck stabs on a repeating rhythm aren't doubtful) and MR-2 (a bright single
// line is a Lead, not Chords). The model is the one served from public/models, loaded from disk here.
import { describe, expect, it } from "vitest";
import { loadBpModelFromDisk } from "./bp-model.node";
import { scoreNotes, renderNotes } from "./layers-bench";
import { LOST_69_76, renderLost6976 } from "./melody-fixture";
import { melodyFromReading } from "./melody-make";
import { MELODY_READER } from "./melody-reader";
import { readNotesBP, resample } from "./notes-bp";

describe("Basic Pitch (L245)", () => {
  it("is the reader Melody uses (one flag)", () => expect(MELODY_READER).toBe("basic-pitch"));

  it("resamples to 22,050 Hz without folding a high tone down", () => {
    const rate = 44100, x = new Float32Array(rate);
    for (let i = 0; i < x.length; i++) x[i] = Math.sin((2 * Math.PI * 15000 * i) / rate); // above 11 kHz: gone
    const y = resample(x, rate);
    expect(y.length).toBe(22050);
    expect(Math.sqrt(y.reduce((a, v) => a + v * v, 0) / y.length)).toBeLessThan(0.02);
  });

  it("reads Lost 69–76's struck G7 stabs within the Z3 bars, and the row isn't doubtful (MR-1)", async () => {
    const { mono, truth, bpm } = renderLost6976(22050, 1);
    const r = await readNotesBP(mono, undefined, 22050, bpm, loadBpModelFromDisk(), LOST_69_76.key);
    const amb = LOST_69_76.ambiguous.map((c) => c[0] / 1000);
    // The grader's rule: notes read at an ambiguous event are neither right nor wrong.
    const s = scoreNotes(truth, r.notes.filter((n) => n.t <= LOST_69_76.lenMs / 1000 + 0.03 && !amb.some((a) => Math.abs(n.t - a) <= 0.03)));
    expect(s.pcFound).toBeGreaterThanOrEqual(0.7);
    expect(s.wrong).toBeLessThanOrEqual(0.2);
    expect(s.p95AbsMs).toBeLessThanOrEqual(30);
    expect(melodyFromReading(r, bpm, mono.length / 22050).rows.chords.doubtful).toBe(false);
  }, 120000);

  it("reads a bright one-note-at-a-time riff as a Lead row, not Chords (MR-2, L242)", async () => {
    const rate = 22050, sps = 60 / 126.05 / 4, n = Math.round(128 * sps * rate);
    const riff = Array.from({ length: 32 }, (_, i) => ({ t: (i * 4 + (i % 2 ? 2 : 0)) * sps, dur: 2.5 * sps, midi: [67, 65, 67, 70][i % 4], vel: 0.9 }));
    const x = renderNotes(riff, { harmonics: 12, tilt: 0.4, attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.05 }, n, rate, 0.15);
    const d = melodyFromReading(await readNotesBP(x, undefined, rate, 126.05, loadBpModelFromDisk(), { key: "G", scale: "minor" }), 126.05, n / rate);
    expect(d.rows.chords.notes).toHaveLength(0);
    expect(d.rows.lead.notes.length).toBeGreaterThanOrEqual(30);
  }, 120000);
});
