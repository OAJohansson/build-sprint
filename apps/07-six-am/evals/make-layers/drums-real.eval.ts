// Drums-slice fixes (D-F1–D-F6): the reader on the hand-labelled real-loop fixture (drums-fixture.ts)
// and the spike bench, against the Z1/Z2 bars. Prints a table; writes drums-real-results.json.
// pnpm -F 07-six-am exec vitest run --config evals/make-layers/vitest.config.mts drums-real
import fs from "node:fs";
import { it } from "vitest";
import { readDrums } from "@/lib/make/drums-read";
import { drumsFromReading } from "@/lib/make/drums-make";
import { REAL_LABELLED, renderLabelled, renderNoiseBuild } from "@/lib/make/drums-fixture";
import { DRUM_ROWS, drumLoops, scoreDrums } from "@/lib/make/layers-bench";

const pct = (x: number) => Math.round(x * 1000) / 10;
it("real-loop fixture and bench", () => {
  const out: Record<string, unknown>[] = [];
  const pool = { te: 0, on: 0, fe: 0, agree: 0, union: 0 };
  for (const spec of REAL_LABELLED) for (const seed of [1, 2]) {
    const { mono, truth } = renderLabelled(spec, seed);
    const r = readDrums(mono, mono, 44100, spec.bpm, 0);
    const s = scoreDrums(truth, r.hits);
    const kt = truth.filter((h) => h.row === "kick").map((h) => h.t);
    const kerr = r.hits.filter((h) => h.row === "kick").map((h) => { const d = kt.reduce((a, t) => (Math.abs(h.t - t) < Math.abs(a) ? h.t - t : a), Infinity); return d * 1000; }).filter((d) => Math.abs(d) < 80).sort((a, b) => a - b);
    const union = Object.values(s.perRow).reduce((a, v) => a + v.right, 0) / Math.max(1e-9, s.labelAgree);
    pool.te += s.truthEvents; pool.on += s.onTime; pool.fe += s.foundEvents; pool.agree += Object.values(s.perRow).reduce((a, v) => a + v.right, 0); pool.union += union;
    const kickSteps = [...new Set(r.rows.kick.map((h) => h.step % 4))].sort();
    out.push({ loop: spec.name, seed, found: pct(s.recall), extra: pct(s.extra), labels: pct(s.labelAgree), kickMedianMs: kerr.length ? Math.round(kerr[Math.floor(kerr.length / 2)]) : null, gridMs: r.gridMs, kickStepsMod4: kickSteps.join(","), claps: r.rows.clap.length, perRow: Object.fromEntries(Object.entries(s.perRow).map(([k, v]) => [k, `${v.right}/${v.truth} right, ${v.found} read`])) });
  }
  out.push({ loop: "POOLED real fixture", found: pct(pool.on / pool.te), extra: pct((pool.fe - pool.on) / pool.te), labels: pct(pool.agree / pool.union) });
  const b = renderNoiseBuild(1);
  const rb = drumsFromReading(readDrums(b.mono, b.mono, 44100, b.bpm, 0), b.bpm);
  out.push({ loop: "Mason 57–64 build", kicks: rb.rows.kick.hits.length, kickDoubtful: rb.rows.kick.doubtful, claps: rb.rows.clap.hits.length, clapDoubtful: rb.rows.clap.doubtful, hats: rb.rows.hats.hits.length });
  const bp = { te: 0, on: 0, fe: 0, agree: 0, union: 0 };
  for (const bleed of [null, -20, -15]) for (const loop of drumLoops(bleed)) {
    const r = readDrums(loop.mono, undefined, loop.rate, loop.bpm, 0);
    const s = scoreDrums(loop.truth, r.hits);
    const agree = Object.values(s.perRow).reduce((a, v) => a + v.right, 0);
    bp.te += s.truthEvents; bp.on += s.onTime; bp.fe += s.foundEvents; bp.agree += agree; bp.union += agree / Math.max(1e-9, s.labelAgree);
  }
  out.push({ loop: "POOLED spike bench (clean, −20, −15 dB)", found: pct(bp.on / bp.te), extra: pct((bp.fe - bp.on) / bp.te), labels: pct(bp.agree / bp.union) });
  for (const o of out) console.log(JSON.stringify(o));
  fs.writeFileSync(new URL("./drums-real-results.json", import.meta.url), JSON.stringify(out, null, 2));
}, 120000);
