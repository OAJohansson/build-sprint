// Phase 6 spike: regression guards for the chord templates, the smoothing, the events and the voicing,
// on small synthetic chroma and notes. Not a grade: the readers are graded on real separated parts by
// data-evals (evals.md H1–H4), never on these.
import { describe, expect, it } from "vitest";
import { CHORD_TYPES, cellsFromHarmony, chordNotes, chordsFromNotes, eventsFromOnsets, leadLine, loopBlend, rankChords, readChords, smoothChords, voiceChord, type ChordCell, type ChordsReading, type StepHarmony } from "./chords-read";
import type { MelodyReading } from "./melody-make";
import type { ReadNote } from "./notes-read";
import { LOST_69_76, renderLost6976 } from "./melody-fixture";
import { CHORD_FIXTURES, scoreCells } from "./chords-fixture";

const chromaOf = (pcs: number[], w: number[] = pcs.map(() => 1)) => { const c = new Array(12).fill(0); pcs.forEach((p, i) => (c[p % 12] += w[i])); return c; };
const top = (pcs: number[], bass?: number[], key?: { key: string; scale: "major" | "minor" }) => rankChords(chromaOf(pcs), bass ? chromaOf(bass) : undefined, key)[0].name;

describe("chord templates", () => {
  it("names each type from its own notes", () => {
    expect(top([7, 11, 2])).toBe("G");
    expect(top([9, 0, 4])).toBe("Am");
    expect(top([7, 11, 2, 5])).toBe("G7");
    expect(top([0, 4, 7, 11])).toBe("Cmaj7");
    expect(top([2, 5, 9, 0])).toBe("Dm7");
    expect(top([5, 10, 0])).toBe("Fsus4");
    expect(top([11, 2, 5])).toBe("Bdim");
  });

  it("lets the low note settle the root (C6 and Am7 share their notes)", () => {
    expect(top([9, 0, 4, 7], [9])).toBe("Am7");
    expect(top([7, 0, 2], [0])).toBe("Csus2");
  });

  it("leans toward the key only on a near tie", () => {
    // Gsus4 (G C D) and Csus2 (C D G) are the same notes; no low note: the key doesn't change that, a G bass does.
    expect(top([7, 0, 2], [7], { key: "C", scale: "major" })).toBe("Gsus4");
    // An out-of-key G7 still wins in G major when its F is clearly there.
    expect(top([7, 11, 2, 5], [7], { key: "G", scale: "major" })).toBe("G7");
  });

  it("ranks the alternatives after the best, with scores", () => {
    const r = rankChords(chromaOf([7, 11, 2, 5]), chromaOf([7]));
    expect(r[0].name).toBe("G7");
    expect(r.slice(1, 4).map((g) => g.name)).toContain("G");
    expect(r[1].score).toBeLessThanOrEqual(r[0].score);
  });
});

describe("chord type (L256, modelled on the spike's real loops; the held-out loop is not here)", () => {
  const read = (name: string) => { const f = CHORD_FIXTURES.find((x) => x.name === name)!; return { f, cells: cellsFromHarmony(f.harmony, f.key) }; };

  it("hears a quiet 7th (CH-1: Lost's G7 stab read as G)", () => {
    const { cells } = read("lost-69-76");
    expect(cells.slice(0, 7).map((c) => c.name)).toEqual(new Array(7).fill("G7"));
    expect(cells[0].alternatives[0].name).toBe("G");
  });

  it("keeps minor minor under a loud 9th (CH-1: Dubspinna's B♭m read as B♭sus2)", () => {
    const { cells } = read("dub-57-64");
    expect([2, 3, 6].map((b) => cells.find((c) => c.bar === b)!.name)).toEqual(["Bbm", "Bbm", "Bbm"]);
    expect(cells[0].name).toBe("C#");
  });

  it("lets the stabs, not a pad under them, name the root (CH-2: Retrouvé's Fm)", () => {
    const { cells } = read("ret-57-64");
    expect(cells.slice(3, 7).map((c) => c.name)).toEqual(["Fm", "Fm", "Fm", "Fm"]);
  });

  it("splits a bar where a stab gives way to a quieter pad (CH-5: Lost 49–56, D7 then Gm)", () => {
    const { cells } = read("lost-49-56");
    expect(cells.filter((c) => c.bar === 2).map((c) => [c.name, c.steps])).toEqual([["D7", 8], ["Gm", 8]]);
  });

  it("holds its level on all the modelled loops (root + family, root, top 4)", () => {
    let fam = 0, famN = 0, root = 0, n = 0, top4 = 0;
    for (const f of CHORD_FIXTURES) {
      const s = scoreCells(cellsFromHarmony(f.harmony, f.key), f.labels);
      fam += s.family * s.famN; famN += s.famN; root += s.root * s.n; n += s.n; top4 += s.top4 * s.famN;
    }
    expect(fam / famN).toBeGreaterThanOrEqual(0.9);
    expect(root / n).toBeGreaterThanOrEqual(0.9);
    expect(top4 / famN).toBeGreaterThanOrEqual(0.9);
  });

  it("doesn't add a 7th for a faint bleed, nor a sus over a clear 3rd", () => {
    expect(top([0, 4, 7, 10], undefined, undefined)).toBe("C7");
    expect(rankChords(chromaOf([0, 4, 7, 10], [1, 0.8, 0.9, 0.12]))[0].name).toBe("C");
    expect(rankChords(chromaOf([10, 1, 5, 0], [1, 0.35, 0.9, 0.8]), chromaOf([10]))[0].name).toBe("Bbm");
    expect(rankChords(chromaOf([10, 5, 0], [1, 0.9, 0.8]), chromaOf([10]))[0].name).toBe("Bbsus2");
  });

  it("reads a pad loop (no strikes) as before", () => {
    const chroma = Array.from({ length: 32 }, (_, s) => chromaOf(s < 16 ? [9, 0, 4] : [5, 9, 0]));
    const h: StepHarmony = { chroma, bass: chroma.map(() => new Array(12).fill(0)), energy: chroma.map(() => 1) };
    expect(cellsFromHarmony(h).map((c) => c.name)).toEqual(["Am", "F"]);
    expect(cellsFromHarmony({ ...h, struck: new Array(32).fill(0) }).map((c) => c.name)).toEqual(["Am", "F"]);
  });
});

describe("loop and smoothing", () => {
  it("keeps a 4-chord loop a loop when one bar is noisy", () => {
    const prog = [[9, 0, 4], [5, 9, 0], [0, 4, 7], [7, 11, 2]];
    const bars = [0, 1, 2, 3, 4, 5, 6, 7].map((b) => chromaOf(prog[b % 4]));
    bars[6] = chromaOf([0, 4, 7, 9], [0.9, 0.9, 0.75, 1]); // bar 7: C with a loud A bleeding in (alone it reads Am7)
    expect(rankChords(bars[6])[0].name).toBe("Am7");
    const blended = loopBlend(bars);
    expect(rankChords(blended[6])[0].name).toBe("C");
  });

  it("doesn't change chord for a tiny score edge", () => {
    const g = (name: string, score: number) => ({ name, root: 0, type: "maj" as const, score });
    const path = smoothChords([[g("C", 0.9), g("Am", 0.8)], [g("Am", 0.82), g("C", 0.8)], [g("C", 0.9), g("Am", 0.7)]]);
    expect(path.map((x) => x?.name)).toEqual(["C", "C", "C"]);
  });

  it("splits a bar only when its halves clearly differ", () => {
    const h = (halves: number[][][]): StepHarmony => {
      const chroma: number[][] = [];
      for (const bar of halves) for (const half of bar) for (let s = 0; s < 8; s++) chroma.push(chromaOf(half));
      return { chroma, bass: chroma.map(() => new Array(12).fill(0)), energy: chroma.map(() => 1) };
    };
    const one = cellsFromHarmony(h([[[0, 4, 7], [0, 4, 7]], [[7, 11, 2], [7, 11, 2]]]));
    expect(one.map((c) => c.name)).toEqual(["C", "G"]);
    const two = cellsFromHarmony(h([[[0, 4, 7], [5, 9, 0]], [[7, 11, 2], [7, 11, 2]]]));
    expect(two.map((c) => [c.name, c.startStep, c.steps])).toEqual([["C", 0, 8], ["F", 8, 8], ["G", 16, 16]]);
  });
});

describe("chord times (L251)", () => {
  const cells = (names: string[]): ChordCell[] => names.map((name, b) => ({ bar: b, startStep: b * 16, steps: 16, name, root: name ? 0 : null, type: name ? "maj" : null, score: 1, alternatives: [] }));
  const bpm = 120, sps = 60 / bpm / 4; // a 16th is 125 ms

  it("plays stabs at their onsets, struck", () => {
    const on = [3, 7, 11, 15].map((s) => ({ t: s * sps, vel: 0.9, end: s * sps + 0.2 }));
    const ev = eventsFromOnsets(on, cells(["C"]), bpm, 16);
    expect(ev.map((e) => [e.step, e.struck, e.held])).toEqual([[3, true, false], [7, true, false], [11, true, false], [15, true, false]]);
  });

  it("holds a pad over two bars of the same chord as one chord, and starts a new one where it changes", () => {
    const ev = eventsFromOnsets([], cells(["Am", "Am", "F", "F"]), bpm, 64);
    expect(ev.map((e) => [e.step, e.held, Math.round(e.dur / sps)])).toEqual([[0, true, 32], [32, true, 32]]);
  });

  it("gives a silent bar no chord", () => {
    const ev = eventsFromOnsets([{ t: 16 * sps, vel: 1, end: 17 * sps }], cells(["C", ""]), bpm, 32);
    expect(ev.every((e) => e.cell === 0)).toBe(true);
  });
});

describe("voicing", () => {
  it("plays the chord's own notes near the original's register", () => {
    const v = voiceChord(7, "7", 64);
    expect(v.map((m) => m % 12).sort((a, b) => a - b)).toEqual([2, 5, 7, 11]);
    expect(Math.abs(v.reduce((a, b) => a + b, 0) / v.length - 64)).toBeLessThanOrEqual(6);
    for (const t of Object.keys(CHORD_TYPES) as (keyof typeof CHORD_TYPES)[]) expect(Math.max(...voiceChord(0, t)) - Math.min(...voiceChord(0, t))).toBeLessThan(12);
  });

  it("turns cells and events into notes on the grid", () => {
    const c: ChordsReading = { reader: "dsp", bpm: 120, steps: 16, bars: 1, register: 60, tuningCents: 0, cells: [{ bar: 0, startStep: 0, steps: 16, name: "Am", root: 9, type: "min", score: 1, alternatives: [] }], events: [{ t: 0.375, dur: 0.2, step: 3, off: 0, cell: 0, struck: true, held: false, vel: 1 }] };
    const ns = chordNotes(c);
    expect(ns.map((n) => n.midi % 12).sort((a, b) => a - b)).toEqual([0, 4, 9]);
    expect(ns.every((n) => n.step === 3 && n.t === 0.375)).toBe(true);
  });
});

describe("readers on synthetic parts (regression only)", () => {
  it("B: notes fold into the same names", () => {
    const sps = 60 / 120 / 4;
    const notes: ReadNote[] = [];
    [[57, 60, 64], [53, 57, 60], [55, 59, 62, 65], [52, 55, 59]].forEach((ch, b) => {
      for (const s of [2, 6, 10, 14]) for (const midi of ch) notes.push({ t: (b * 16 + s) * sps, dur: 2 * sps, midi, vel: 0.8, step: b * 16 + s, offsetMs: 0 });
    });
    const r = chordsFromNotes(notes, 120, 64 * sps, { key: "A", scale: "minor" });
    expect(r.cells.map((c) => c.name)).toEqual(["Am", "F", "G7", "Em"]);
    expect(r.events).toHaveLength(16);
    expect(r.events.every((e) => e.struck)).toBe(true);
  });

  it("A: reads the Lost 69–76 fixture's G7 stabs (re-rendered from the labels)", () => {
    const { mono, bpm } = renderLost6976(22050, 1);
    const r = readChords(mono, undefined, 22050, bpm, LOST_69_76.key);
    const names = r.cells.slice(0, 6).map((c) => c.name);
    expect(names.filter((x) => x === "G7").length).toBeGreaterThanOrEqual(5);
    expect(r.events.length).toBeGreaterThan(20);
  });

  it("lead: the Lead row when there is one, else the top line", () => {
    const n = (t: number, midi: number) => ({ t, dur: 0.1, midi, vel: 1, step: 0, off: 0, durSteps: 1 });
    const m = (chords: ReturnType<typeof n>[], lead: ReturnType<typeof n>[]): MelodyReading => ({ rows: { chords: { notes: chords, doubtful: false, why: null, note: null }, lead: { notes: lead, doubtful: false, why: null, note: null } }, steps: 16, bars: 1, lead: lead.length > 0, tuningCents: 0 });
    expect(leadLine(m([n(0, 60)], [n(0, 72)])).from).toBe("row");
    const t = leadLine(m([n(0, 60), n(0, 64), n(0.5, 62), n(0.5, 65)], []));
    expect(t.notes.map((x) => x.midi)).toEqual([64, 65]);
  });
});
