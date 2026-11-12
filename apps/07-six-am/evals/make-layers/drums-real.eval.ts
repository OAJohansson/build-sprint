// Drums-slice fixes (D-F1–D-F6): the reader on the hand-labelled real-loop fixture (drums-fixture.ts)
// and the spike bench, against the Z1/Z2 bars. Prints a table; writes drums-real-results.json.
// pnpm -F 07-six-am exec vitest run --config evals/make-layers/vitest.config.mts drums-real
import fs from "node:fs";
import { it } from "vitest";
import { readDrums } from "@/lib/make/drums-read";
import { drumsFromReading, measureRows, renderDrumsMine, suggestDrum, ROW_BAND } from "@/lib/make/drums-make";
import { band } from "@/lib/make/closeness";
import { ROW_PRESETS, DRUM_PRESETS, type DrumRow } from "@/lib/make/drum-synth";
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
  for (const mine of [false, true]) {
    const bp = { te: 0, on: 0, fe: 0, agree: 0, union: 0 };
    for (const bleed of [null, -20, -15]) for (const loop of drumLoops(bleed)) {
      const r = readDrums(loop.mono, undefined, loop.rate, loop.bpm, 0);
      // "As Mine plays": the doubtful rows (L225, D-F6) left out, as Make does by default.
      const off = mine ? DRUM_ROWS.filter((row) => drumsFromReading(r, loop.bpm).rows[row].doubtful) : [];
      const s = scoreDrums(loop.truth, r.hits.filter((h) => !off.includes(h.row)));
      const agree = Object.values(s.perRow).reduce((a, v) => a + v.right, 0);
      bp.te += s.truthEvents; bp.on += s.onTime; bp.fe += s.foundEvents; bp.agree += agree; bp.union += agree / Math.max(1e-9, s.labelAgree);
    }
    out.push({ loop: `POOLED spike bench (clean, −20, −15 dB)${mine ? ", as Mine plays" : ", reader"}`, found: pct(bp.on / bp.te), extra: pct((bp.fe - bp.on) / bp.te), labels: pct(bp.agree / bp.union) });
  }
  for (const o of out) console.log(JSON.stringify(o));
  fs.writeFileSync(new URL("./drums-real-results.json", import.meta.url), JSON.stringify(out, null, 2));
}, 120000);

/** The grader's independent Z6 check (D-F7): each hit's envelope in its row's low/own band, 1 ms hops
 *  over 0–200 ms, in dB under that hit's peak; mean |difference| original vs Mine over the row's hits. */
function envDistance(orig: Float32Array, mine: Float32Array, rate: number, times: number[], lo: number, hi: number) {
  const a = band(orig, rate, lo, hi), b = band(mine, rate, lo, hi), W = Math.round(rate * 0.001), N = 200;
  const env = (x: Float32Array, at: number) => { const e: number[] = []; for (let k = 0; k < N; k++) { let s = 0; for (let i = at + k * W; i < at + (k + 1) * W && i < x.length; i++) s += x[i] * x[i]; e.push(10 * Math.log10(s / W + 1e-20)); } const top = Math.max(...e); return e.map((v) => Math.max(v - top, -40)); };
  let d = 0, n = 0;
  for (const t of times) { const at = Math.round(t * rate); if (at < 0 || at + N * W >= a.length) continue; const ea = env(a, at), eb = env(b, at); for (let k = 0; k < N; k++) { d += Math.abs(ea[k] - eb[k]); n++; } }
  return n ? d / n : NaN;
}

it("Suggest per row, the product's distance and the independent envelope check", () => {
  const out: string[] = [];
  const BANDS: Record<DrumRow, [number, number]> = { kick: [30, 120], clap: ROW_BAND.clap, hats: ROW_BAND.hats };
  for (const spec of REAL_LABELLED) {
    const { mono } = renderLabelled(spec, 1);
    const d = drumsFromReading(readDrums(mono, mono, 44100, spec.bpm, 0), spec.bpm);
    const targets = measureRows(mono, mono, 44100, d);
    const sps = 60 / spec.bpm / 4;
    for (const row of DRUM_ROWS) {
      const t = targets[row];
      if (!t) continue;
      const preset = ROW_PRESETS[row][0];
      const sug = suggestDrum(t, preset);
      const mineAt = (macros: Record<string, number>) => {
        const sounds = Object.fromEntries(DRUM_ROWS.map((r) => [r, { preset: ROW_PRESETS[r][0], macros: r === row ? macros : DRUM_PRESETS[ROW_PRESETS[r][0]].macros, on: r === row }])) as never;
        const levels = Object.fromEntries(DRUM_ROWS.map((r) => [r, targets[r]?.levelDb ?? null])) as never;
        const m = renderDrumsMine(d, sounds, levels, spec.bpm, 44100);
        // Mine is rendered from the grid's step 0; turn it by the grid so hits line up with the original.
        const k = Math.round((d.gridMs / 1000) * 44100), n = mono.length, x = new Float32Array(n);
        for (let i = 0; i < Math.min(n, m.left.length); i++) x[(((i + k) % n) + n) % n] = (m.left[i] + m.right[i]) / 2;
        return envDistance(mono, x, 44100, d.rows[row].hits.map((h) => h.t), ...BANDS[row]);
      };
      const before = mineAt(DRUM_PRESETS[preset].macros as Record<string, number>), after = mineAt(sug.macros as Record<string, number>);
      out.push(`${spec.name} ${row}: product ${sug.presetDistance.toFixed(2)} -> ${sug.distance.toFixed(2)}; envelope ${before.toFixed(2)} -> ${after.toFixed(2)} dB ${after <= before ? "closer" : "FURTHER"}`);
      void sps;
    }
  }
  for (const o of out) console.log(o);
}, 300000);
