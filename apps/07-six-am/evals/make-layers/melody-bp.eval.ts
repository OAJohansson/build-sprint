// L245: Basic Pitch against the DSP reader, side by side, on the Lost 69–76 fixture (a re-render of the
// real labels, melody-fixture.ts) and the spike's chord bench (clean and with bleed). Z3 found / wrong /
// onset p95, notes, time per loop. Node runs TF.js on its plain CPU backend (the slowest case).
// pnpm -F 07-six-am exec vitest run --config evals/make-layers/vitest.config.mts melody-bp
import fs from "node:fs";
import { it } from "vitest";
import { renderLost6976, LOST_69_76 } from "@/lib/make/melody-fixture";
import { chordLoops, scoreNotes, type TruthNote } from "@/lib/make/layers-bench";
import { readNotes } from "@/lib/make/notes-read";
import { BP_OPT, readNotesBP } from "@/lib/make/notes-bp";
import { loadBpModelFromDisk } from "@/lib/make/bp-model.node";

const pct = (x: number) => Math.round(x * 1000) / 10;
/** The grader's rule: notes read at an ambiguous event are neither right nor wrong. */
const score = (truth: TruthNote[], found: { t: number; midi: number }[], ambiguous: number[] = []) => scoreNotes(truth, found.filter((f) => !ambiguous.some((a) => Math.abs(f.t - a) <= 0.03)));

it("Basic Pitch vs DSP", async () => {
  const sweep = process.env.BP_SWEEP ? JSON.parse(process.env.BP_SWEEP) as [number, number, number][] : [[BP_OPT.onset, BP_OPT.frame, BP_OPT.minFrames]];
  const model = await loadBpModelFromDisk();
  const out: Record<string, unknown>[] = [];
  const amb = LOST_69_76.ambiguous.map((c) => c[0] / 1000);
  const loops = [{ name: "Lost 69–76 (fixture)", ...renderLost6976(22050, 1), rate: 22050, key: LOST_69_76.key, amb, lenS: LOST_69_76.lenMs / 1000 },
    ...[null, -20].flatMap((bleed) => chordLoops(bleed).map((l) => ({ name: `${l.name}${bleed === null ? "" : " −20 dB"}`, mono: l.mono, truth: l.truth, bpm: l.bpm, rate: l.rate, key: l.key!, amb: [] as number[], lenS: Infinity })))];
  for (const l of loops) {
    const t0 = performance.now();
    const dsp = readNotes(l.mono, undefined, l.rate, l.bpm, l.key);
    const dspMs = performance.now() - t0;
    const d = score(l.truth, dsp.notes.filter((n) => n.t <= l.lenS + 0.03), l.amb);
    const row: Record<string, unknown> = { loop: l.name, dsp: `${pct(d.pcFound)} / ${pct(d.wrong)} / ${Math.round(d.p95AbsMs)} ms (${Math.round(dspMs)} ms)` };
    for (const [on, fr, mf] of sweep) {
      Object.assign(BP_OPT, { onset: on, frame: fr, minFrames: mf });
      const t1 = performance.now();
      const bp = await readNotesBP(l.mono.slice(), undefined, l.rate, l.bpm, model, l.key);
      const bpMs = performance.now() - t1;
      const b = score(l.truth, bp.notes.filter((n) => n.t <= l.lenS + 0.03), l.amb);
      row[`bp ${on}/${fr}/${mf}`] = `${pct(b.pcFound)} / ${pct(b.wrong)} / ${Math.round(b.p95AbsMs)} ms (${Math.round(bpMs)} ms)`;
    }
    out.push(row);
    console.log(JSON.stringify(row));
  }
  fs.writeFileSync(new URL("./melody-bp-results.json", import.meta.url), JSON.stringify(out, null, 2));
}, 1800000);
