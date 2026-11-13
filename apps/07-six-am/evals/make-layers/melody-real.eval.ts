// Melody fix round (M-F2): the note reader on the hand-labelled Lost 69–76 fixture (melody-fixture.ts)
// and the spike's chord bench, against the Z3 bars. Prints a table; writes melody-real-results.json.
// pnpm -F 07-six-am exec vitest run --config evals/make-layers/vitest.config.mts melody-real
import fs from "node:fs";
import { it } from "vitest";
import { renderLost6976, LOST_69_76 } from "@/lib/make/melody-fixture";
import { CHORD_SPECS, renderChordPart, scoreNotes } from "@/lib/make/layers-bench";
import { readNotes } from "@/lib/make/notes-read";

const pct = (x: number) => Math.round(x * 1000) / 10;
it("Lost 69–76 fixture and the chord bench", () => {
  const out: Record<string, unknown>[] = [];
  for (const seed of [1, 2]) {
    const { mono, truth, bpm } = renderLost6976(22050, seed);
    const r = readNotes(mono, undefined, 22050, bpm, LOST_69_76.key);
    const s = scoreNotes(truth, r.notes.filter((n) => n.t <= LOST_69_76.lenMs / 1000 + 0.03));
    const perPc = Object.fromEntries([7, 2, 11, 5].map((pc) => [["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][pc], truth.filter((n) => n.midi % 12 === pc).length ? `${r.notes.filter((n) => n.midi % 12 === pc).length} read`: "-"]));
    const longest = r.notes.reduce((a, n) => Math.max(a, n.dur), 0);
    out.push({ loop: "Lost 69–76", seed, pcFound: pct(s.pcFound), wrong: pct(s.wrong), p95Ms: Math.round(s.p95AbsMs * 10) / 10, notes: r.notes.length, longestNoteS: Math.round(longest * 10) / 10, perPc });
  }
  for (const spec of CHORD_SPECS) {
    const { mono, truth } = renderChordPart(spec, { rate: 44100, seed: 1 });
    const s = scoreNotes(truth, readNotes(mono, undefined, 44100, spec.bpm, spec.key).notes);
    out.push({ loop: spec.name, pcFound: pct(s.pcFound), wrong: pct(s.wrong), p95Ms: Math.round(s.p95AbsMs * 10) / 10 });
  }
  for (const o of out) console.log(JSON.stringify(o));
  fs.writeFileSync(new URL("./melody-real-results.json", import.meta.url), JSON.stringify(out, null, 2));
}, 300000);
