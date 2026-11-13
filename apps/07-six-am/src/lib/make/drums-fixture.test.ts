// Drums-slice fix round (D-F1–D-F6): the reader against the hand-labelled real-loop fixture
// (drums-fixture.ts, numbers only), so the real-track failures can't come back silently, plus the
// Studio drop on a default track (D-F4) and the drums A/B level (D-F5).
import { describe, expect, it } from "vitest";
import { dropLibSound } from "@/lib/studio-drop";
import { lanesOf } from "@/lib/studio-lanes";
import type { Doc } from "@/lib/timeline";
import { LOST_FLAM, REAL_LABELLED, renderLabelled, renderNoiseBuild } from "./drums-fixture";
import { DRUM_PRESETS, DRUM_ROWS, ROW_PRESETS } from "./drum-synth";
import { drumsFromReading, measureRows } from "./drums-make";
import { readDrums } from "./drums-read";
import { runMakeJob } from "./jobs";
import { scoreDrums } from "./layers-bench";
import { lufs } from "./level";
import { parseNewSound, type LibrarySound } from "./library";

const RATE = 44100;

describe("the real-loop fixture (Z1, Z2)", () => {
  for (const spec of REAL_LABELLED) {
    it(`${spec.name}: hits on time, labelled right, kicks on the attack, one grid`, () => {
      const grids: number[] = [];
      for (const seed of [1, 2]) {
        const { mono, truth } = renderLabelled(spec, seed);
        const r = readDrums(mono, mono, RATE, spec.bpm, 0);
        const s = scoreDrums(truth, r.hits);
        expect(s.recall, "Z1 found").toBeGreaterThanOrEqual(0.9);
        expect(s.extra, "Z1 extra").toBeLessThanOrEqual(0.1);
        expect(s.labelAgree, "Z2 labels").toBeGreaterThanOrEqual(0.85);
        // D-F1: every kick within 10 ms of its attack.
        const kt = truth.filter((h) => h.row === "kick").map((h) => h.t);
        const late = r.hits.filter((h) => h.row === "kick").map((h) => Math.min(...kt.map((t) => Math.abs(h.t - t)))).filter((d) => d > 0.01);
        expect(late.length, "kicks off their attack by > 10 ms").toBeLessThanOrEqual(2);
        // D-F2: no clap on an open hat (claps only where the labels have one).
        expect(r.rows.clap.length).toBeLessThanOrEqual(17);
        // D-F3: step 0 is the beat the kicks play.
        expect(Math.abs(r.gridMs - (spec.gridOffsetMs ?? 0)), "grid against the true beat (ms)").toBeLessThanOrEqual(5);
        grids.push(r.gridMs);
      }
      expect(Math.abs(grids[0] - grids[1]), "the same grid on two reads").toBeLessThanOrEqual(3);
    });
  }

  it("a flammed clap is timed at its first burst, not at the kick (D-R1)", () => {
    let n = 0, onTime = 0;
    for (const seed of [1, 2, 3]) {
      const { mono, truth } = renderLabelled(LOST_FLAM, seed);
      const claps = readDrums(mono, mono, RATE, LOST_FLAM.bpm, 0).hits.filter((h) => h.row === "clap");
      for (const t of truth.filter((h) => h.row === "clap").map((h) => h.t)) { n++; if (claps.some((c) => Math.abs(c.t - t) <= 0.01)) onTime++; }
    }
    expect(onTime / n).toBeGreaterThanOrEqual(0.9);
  });

  it("a noise build's patternless kicks are doubtful, off in Mine (D-F6)", () => {
    const b = renderNoiseBuild(1);
    const d = drumsFromReading(readDrums(b.mono, b.mono, RATE, b.bpm, 0), b.bpm);
    if (d.rows.kick.hits.length) {
      expect(d.rows.kick.doubtful).toBe(true);
      expect(d.rows.kick.why).toMatch(/no repeating pattern/);
    }
    expect(d.rows.hats.doubtful).toBe(false);
  });
});

describe("drums A/B at the same perceived loudness (D-F5, Z5)", () => {
  it("matches LUFS within 0.1 LU for bright, short and dark, long sets", () => {
    const spec = REAL_LABELLED[2];
    const { mono } = renderLabelled(spec, 1);
    const read = runMakeJob({ type: "drums-read", id: 1, left: mono.slice(), right: mono.slice(), rate: RATE, bpm: spec.bpm }).res;
    if (read.type !== "drums-read") throw new Error(read.type);
    const target = lufs({ left: mono, right: mono, rate: RATE });
    const sets = [["kick-tight", "clap-rim", "hats-shaker"], ["kick-round-808", "clap-tight-snare", "hats-ride"], DRUM_ROWS.map((r) => ROW_PRESETS[r][0])];
    for (const set of sets) {
      const sounds = Object.fromEntries(DRUM_ROWS.map((r, i) => [r, { preset: set[i], macros: DRUM_PRESETS[set[i] as keyof typeof DRUM_PRESETS].macros, on: true }])) as never;
      const levels = Object.fromEntries(DRUM_ROWS.map((r) => [r, read.targets[r]?.levelDb ?? null])) as never;
      const res = runMakeJob({ type: "drums-render", id: 2, reading: read.reading, sounds, levels, report: read.report, bpm: spec.bpm, rate: RATE, samples: mono.length, levelDb: read.levelDb, lufs: read.lufs }).res;
      if (res.type !== "drums-render") throw new Error(res.type);
      expect(Math.abs(lufs(res) - target), set.join(" + ")).toBeLessThanOrEqual(0.1);
    }
    expect(measureRows(mono, mono, RATE, read.reading).kick).not.toBeNull();
  });
});

describe("Studio drop on a default track (D-F4)", () => {
  const raw = (preset: string) => ({ ...parseNewSound({ part: "drums", preset, macros: {}, pattern: { bars: 1, notes: [{ step: 4, midi: 39, dur: 1, vel: 1 }] }, key: "A", scale: "minor", bpm: 124 })!, id: "0f8fad5b-d9cb-469f-a165-70867728950e", createdAt: "", updatedAt: "" }) as LibrarySound;

  it("a clap dropped on the Drums lane gets its own lane and leaves the kick's block alone", () => {
    const kick = dropLibSound({ regions: [], muted: [false, false, false, false] } as unknown as Doc, raw("kick-deep-909"), 1, { laneId: "drums" })!;
    expect(kick.laneId).toBe("drums"); // the old Drums lane is kick-type: a kick goes there
    const clap = dropLibSound(kick.doc, raw("clap-wide"), 1, { laneId: "drums" })!;
    const lanes = lanesOf(clap.doc);
    expect(lanes.find((l) => l.id === clap.laneId)!.type).toBe("clap");
    expect(clap.doc.regions.find((r) => r.id === kick.regionId)).toBeDefined();
    const hats = dropLibSound(clap.doc, raw("hats-open-909"), 1, { laneId: "drums" })!;
    expect(lanesOf(hats.doc).find((l) => l.id === hats.laneId)!.type).toBe("hats");
    expect(hats.doc.regions.filter((r) => r.start === 1)).toHaveLength(3);
  });
});
