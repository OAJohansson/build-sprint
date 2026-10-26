// Y10 re-grade (after L205) on readings I captured live with the current build (numbers only).
import fs from "node:fs";
import { expect, it } from "vitest";
import { suggestFor } from "@/lib/make/from-part";
import { featuresOf } from "@/lib/make/match";
import { notesForLoop } from "@/lib/make/pattern";
import { MAKE_PRESETS, MAKE_PRESET_IDS } from "@/lib/make/presets";

const files = ["y10-readings-mason.json", "y10-readings-track2.json"].filter((f) => fs.existsSync(new URL(`./${f}`, import.meta.url)));
it("Y10 re-grade", () => {
  const rows: Record<string, unknown>[] = [];
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(new URL(`./${f}`, import.meta.url), "utf8"));
    const bpm = f.includes("mason") ? 126.05 : j.bpm;
    for (const l of j.loops.filter((x: { readState: string }) => x.readState === "ready")) {
      const reading = { pattern: l.pattern, features: l.features, loopSteps: 0 };
      const steps = l.pattern.bars * 16, notes = notesForLoop(l.pattern, steps);
      for (const p of MAKE_PRESET_IDS) {
        const s = suggestFor(reading, p, bpm);
        const fp = featuresOf(p, MAKE_PRESETS[p].macros, notes, bpm, steps), fs2 = featuresOf(p, s.macros, notes, bpm, steps), t = l.features;
        // Independent per-feature errors (brightness in octaves, length in 16ths, pitch drop in semitones).
        const err = (x: typeof t) => ({ bright: Math.abs(Math.log2(x.brightHz / t.brightHz)), length: Math.abs(x.lengthSteps - t.lengthSteps), drop: Math.abs(x.dropSemis - t.dropSemis) });
        const ep = err(fp), es = err(fs2);
        const better = (Object.keys(ep) as (keyof typeof ep)[]).filter((k) => es[k] < ep[k] - 1e-6);
        const extremes = Object.entries(s.macros).filter(([, v]) => v <= 0.05 || v >= 0.95).map(([k, v]) => `${k}=${v}`);
        const atHomeExtreme = extremes.filter((e) => { const [k, v] = e.split("="); return Math.abs(+v - (MAKE_PRESETS[p].macros as Record<string, number>)[k]) < 0.051; });
        rows.push({ file: f, loop: `${Math.round(l.loop.startMs)}-${Math.round(l.loop.endMs)}`, preset: p, presetDistance: +s.presetDistance.toFixed(1), distance: +s.distance.toFixed(1), drop: Math.round((1 - s.distance / s.presetDistance) * 100), better, extremes, movedToExtreme: extremes.length - atHomeExtreme.length, targetDrop: +t.dropSemis.toFixed(1), targetWobble: +t.wobble.toFixed(2), targetBright: Math.round(t.brightHz), macros: s.macros });
      }
    }
  }
  fs.writeFileSync(new URL("./y10b-results.json", import.meta.url), JSON.stringify(rows, null, 1));
  expect(rows.length).toBeGreaterThan(0);
});
