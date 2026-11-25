// Melody fix round (M-F2): the note reader on the hand-labelled Lost 69–76 fixture (melody-fixture.ts,
// numbers only) against the Z3 bars, so struck stabs merged into held notes can't come back silently.
import { describe, expect, it } from "vitest";
import { LOST_69_76, renderLost6976 } from "./melody-fixture";
import { scoreNotes } from "./layers-bench";
import { readNotes } from "./notes-read";

describe("Lost 69–76, a G7 stab struck while it still rings (Z3, M-F2)", () => {
  const { mono, truth, bpm } = renderLost6976(22050, 1);
  const r = readNotes(mono, undefined, 22050, bpm, LOST_69_76.key);
  it("reads ≥ 70 % of each chord's pitch classes on time, ≤ 20 % wrong, onsets ≤ 30 ms", () => {
    const s = scoreNotes(truth, r.notes.filter((n) => n.t <= LOST_69_76.lenMs / 1000 + 0.03));
    expect(s.pcFound).toBeGreaterThanOrEqual(0.7);
    expect(s.wrong).toBeLessThanOrEqual(0.2);
    expect(s.p95AbsMs).toBeLessThanOrEqual(30);
  });
  it("splits a ringing note where it is struck again (no 6.5 s G3), and keeps the 7th", () => {
    expect(Math.max(...r.notes.map((n) => n.dur))).toBeLessThan(2);
    expect(r.notes.filter((n) => n.midi % 12 === 5).length).toBeGreaterThanOrEqual(25); // F: the 7th (was 11)
  });
});
