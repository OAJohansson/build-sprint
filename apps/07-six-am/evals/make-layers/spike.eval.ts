// The reading spike's numbers against the Z1–Z3 bars, on the synthetic bench (layers-bench.ts):
// 6 drum loops and 6 pitched parts, 8 bars each, clean and with the other parts bled in at −25,
// −20 and −15 dB. Writes spike-results.json next to this file. Measurements, not unit tests.
import fs from "node:fs";
import { it } from "vitest";
import { readDrums } from "@/lib/make/drums-read";
import { chordLoops, DRUM_ROWS, drumLoops, scoreDrums, scoreNotes } from "@/lib/make/layers-bench";
import { readNotes } from "@/lib/make/notes-read";

const r1 = (x: number) => Math.round(x * 1000) / 10;
const out: { drums: Record<string, unknown>[]; notes: Record<string, unknown>[]; pooled: Record<string, unknown>[] } = { drums: [], notes: [], pooled: [] };
const BLEEDS = [null, -25, -20, -15];

it("drums", () => {
  for (const bleed of BLEEDS) {
    const pool = { te: 0, on: 0, extra: 0, agree: 0, union: 0, steps: 0, stepsRight: 0, ms: [] as number[], errs: [] as number[] };
    for (const loop of drumLoops(bleed)) {
      const t0 = performance.now();
      const r = readDrums(loop.mono, undefined, loop.rate, loop.bpm, 0);
      const ms = performance.now() - t0;
      const s = scoreDrums(loop.truth, r.hits);
      // Steps: the truth's 16th per row against the reader's quantised steps (grid from the bench).
      const sps = 60 / loop.bpm / 4, off = (r.gridMs - 0) / 1000;
      let right = 0, all = 0;
      for (const row of DRUM_ROWS) {
        const truthSteps = new Set(loop.truth.filter((h) => h.row === row).map((h) => Math.round((h.t - off) / sps)));
        const read = new Set(r.rows[row].map((h) => h.step));
        for (const st of new Set([...truthSteps, ...read])) { all++; if (truthSteps.has(st) && read.has(st)) right++; }
      }
      pool.te += s.truthEvents; pool.on += s.onTime; pool.extra += s.foundEvents - s.onTime; pool.steps += all; pool.stepsRight += right; pool.ms.push(ms);
      const lab = Object.values(s.perRow);
      pool.agree += lab.reduce((a, v) => a + v.right, 0);
      pool.union += Math.round(lab.reduce((a, v) => a + v.right, 0) / Math.max(1e-9, s.labelAgree));
      out.drums.push({ loop: loop.name, bleed, ms: Math.round(ms), found: r1(s.recall), extra: r1(s.extra), medianMs: +s.medianAbsMs.toFixed(1), p95Ms: +s.p95AbsMs.toFixed(1), labels: r1(s.labelAgree), steps: r1(right / Math.max(1, all)), swingMs: r.swingMs, perRow: Object.fromEntries(Object.entries(s.perRow).map(([k, v]) => [k, `${v.right}/${v.truth} right, ${v.found} read`])) });
    }
    out.pooled.push({ family: "drums", bleed, found: r1(pool.on / pool.te), extra: r1(pool.extra / pool.te), labels: r1(pool.agree / Math.max(1, pool.union)), steps: r1(pool.stepsRight / pool.steps), maxMs: Math.round(Math.max(...pool.ms)), meanMs: Math.round(pool.ms.reduce((a, b) => a + b, 0) / pool.ms.length) });
  }
});

it("notes", () => {
  for (const bleed of BLEEDS) {
    const pool = { chords: 0, pc: 0, found: 0, wrong: 0, ms: [] as number[] };
    for (const loop of chordLoops(bleed)) {
      const t0 = performance.now();
      const r = readNotes(loop.mono, undefined, loop.rate, loop.bpm, loop.key);
      const ms = performance.now() - t0;
      const s = scoreNotes(loop.truth, r.notes);
      pool.chords += s.chords; pool.pc += s.pcFound * s.chords; pool.found += s.found; pool.wrong += s.wrong * s.found; pool.ms.push(ms);
      out.notes.push({ loop: loop.name, bleed, ms: Math.round(ms), chords: s.chords, truthNotes: loop.truth.length, read: s.found, pcFound: r1(s.pcFound), exactFound: r1(s.exactFound), wrong: r1(s.wrong), medianMs: +s.medianAbsMs.toFixed(1), p95Ms: +s.p95AbsMs.toFixed(1) });
    }
    out.pooled.push({ family: "notes", bleed, pcFound: r1(pool.pc / pool.chords), wrong: r1(pool.wrong / Math.max(1, pool.found)), maxMs: Math.round(Math.max(...pool.ms)), meanMs: Math.round(pool.ms.reduce((a, b) => a + b, 0) / pool.ms.length) });
  }
});

it("writes results", () => {
  fs.writeFileSync(new URL("./spike-results.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
  for (const p of out.pooled) process.stdout.write(JSON.stringify(p) + "\n");
  for (const d of [...out.drums, ...out.notes]) process.stdout.write(JSON.stringify(d) + "\n");
});
