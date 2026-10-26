// Y9 (A/B level) and Y10 (Suggest settings) on the 5 bass-loop readings captured live (numbers only:
// pattern + features + level of the separated bass; no audio). Same code path as Make's worker.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { runMakeJob } from "@/lib/make/jobs";
import { suggestFor } from "@/lib/make/from-part";
import { featureDistance } from "@/lib/make/features";
import { featuresOf } from "@/lib/make/match";
import { notesForLoop } from "@/lib/make/pattern";
import { MAKE_PRESETS, MAKE_PRESET_IDS } from "@/lib/make/presets";
import { rmsDb } from "@/lib/make/level";

const loops = JSON.parse(fs.readFileSync(new URL("./lab-loop-readings.json", import.meta.url), "utf8")).loops.filter((l: { readState: string }) => l.readState === "ready");
const BPM = 126.05, RATE = 44100;
const db = (x: number) => 10 * Math.log10(x + 1e-20);
describe("Y9/Y10", () => {
  it("runs", () => {
    const ab: unknown[] = [], sug: unknown[] = [];
    for (const l of loops) {
      const bars = Math.round((l.loop.endMs - l.loop.startMs) / 1000 / (240 / BPM));
      const reading = { pattern: l.pattern, features: l.features, loopSteps: bars * 16 };
      const samples = Math.round(((l.loop.endMs - l.loop.startMs) / 1000) * RATE);
      for (const p of MAKE_PRESET_IDS) {
        const r = runMakeJob({ type: "render", id: 1, reading, active: l.active, preset: p, macros: MAKE_PRESETS[p].macros, bpm: BPM, rate: RATE, levelDb: l.levelDb, samples });
        if (r.res.type !== "render") throw new Error("render failed");
        const { left, right } = r.res;
        let e = 0; for (let i = 0; i < left.length; i++) { const m = (left[i] + right[i]) / 2; e += m * m; }
        ab.push({ loop: `${l.loop.startMs | 0}`, bars, preset: p, originalDb: +l.levelDb.toFixed(2), mineStereoDb: +rmsDb({ left, right, rate: RATE }).toFixed(2), mineMonoDb: +db(e / left.length).toFixed(2) });
        const s = suggestFor(reading, p, BPM);
        // Independent re-measure: render both settings, measure, compare (same features, fresh run).
        const steps = l.pattern.bars * 16, notes = notesForLoop(l.pattern, steps);
        const dPreset = featureDistance(featuresOf(p, MAKE_PRESETS[p].macros, notes, BPM, steps), l.features);
        const dSug = featureDistance(featuresOf(p, s.macros, notes, BPM, steps), l.features);
        const extremes = Object.entries(s.macros).filter(([, v]) => v <= 0.05 || v >= 0.95).map(([k, v]) => `${k}=${v}`);
        sug.push({ loop: `${l.loop.startMs | 0}`, preset: p, presetDistance: +dPreset.toFixed(1), suggestedDistance: +dSug.toFixed(1), dropPct: Math.round((1 - dSug / dPreset) * 100), macros: s.macros, extremes, targetDropSemis: +l.features.dropSemis.toFixed(1), targetBrightHz: Math.round(l.features.brightHz) });
      }
    }
    fs.writeFileSync(new URL("./y9y10-results.json", import.meta.url), JSON.stringify({ ab, sug }, null, 1));
    expect(ab.length).toBe(loops.length * 4);
  });
});
