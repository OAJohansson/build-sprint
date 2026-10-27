// The reading spike's numbers (Z1–Z3 bars) on the synthetic bench, clean and with bleed.
import fs from "node:fs";
import { it } from "vitest";
import { readDrums } from "@/lib/make/drums-read";
import { chordLoops, drumLoops, scoreDrums, scoreNotes } from "@/lib/make/layers-bench";
import { readNotes } from "@/lib/make/notes-read";

const pct = (x: number) => `${Math.round(x * 1000) / 10}`;
const out: Record<string, unknown[]> = { drums: [], notes: [] };
const only = process.env.ONLY;

it("drums", () => {
  if (only && only !== "drums") return;
  for (const bleed of [null, -25, -20, -15]) {
    for (const loop of drumLoops(bleed)) {
      const t0 = performance.now();
      const r = readDrums(loop.mono, undefined, loop.rate, loop.bpm, 0);
      const ms = performance.now() - t0;
      const s = scoreDrums(loop.truth, r.hits);
      const row = { loop: loop.name, bleed, ms: Math.round(ms), found: pct(s.recall), extra: pct(s.extra), medMs: s.medianAbsMs.toFixed(1), p95Ms: s.p95AbsMs.toFixed(1), meanMs: s.meanErrMs.toFixed(1), labels: pct(s.labelAgree), perRow: Object.entries(s.perRow).map(([k, v]) => `${k} ${v.right}/${v.truth}t/${v.found}f`).join(" "), swing: r.swingMs, grid: r.gridMs };
      out.drums.push(row);
      if (process.env.DEBUG) {
        const sps = 60 / loop.bpm / 4;
        const fp = r.hits.filter((h) => !loop.truth.some((t) => t.row === h.row && Math.abs(t.t - h.t) <= 0.012)).map((h) => `${h.row[0]}${Math.round(h.t / sps) % 16}@${h.vel}`);
        const fn = loop.truth.filter((t) => !r.hits.some((h) => t.row === h.row && Math.abs(t.t - h.t) <= 0.012)).map((h) => `${h.row[0]}${Math.round(h.t / sps) % 16}`);
        process.stdout.write(`  FP ${fp.slice(0, 40).join(" ")}\n  FN ${fn.slice(0, 30).join(" ")}\n`);
      }
      process.stdout.write(JSON.stringify(row) + "\n");
    }
  }
});

it("notes", () => {
  if (only && only !== "notes") return;
  for (const bleed of [null, -25, -20, -15]) {
    for (const loop of chordLoops(bleed)) {
      const t0 = performance.now();
      const r = readNotes(loop.mono, undefined, loop.rate, loop.bpm, loop.key);
      const ms = performance.now() - t0;
      const s = scoreNotes(loop.truth, r.notes);
      const row = { loop: loop.name, bleed, ms: Math.round(ms), chords: s.chords, found: s.found, truthNotes: loop.truth.length, pc: pct(s.pcFound), exact: pct(s.exactFound), wrong: pct(s.wrong), medMs: s.medianAbsMs.toFixed(1), p95Ms: s.p95AbsMs.toFixed(1) };
      out.notes.push(row);
      process.stdout.write(JSON.stringify(row) + "\n");
    }
  }
});

it("writes results", () => {
  if (!only) fs.writeFileSync(new URL("./spike-results.json", import.meta.url), JSON.stringify(out, null, 1));
});
