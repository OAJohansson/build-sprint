import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { begunLine, detailLine, seeIdea, stateLabel, stateOf, threadProgress, touchSchool, withHistory, type Progress } from "./progress";
import type { Visit } from "./visits";

const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
const SCHOOLS = [
  { id: "sto", ideas: ["Virtue", "Fate"] },
  { id: "exi", ideas: ["Freedom", "Absurd", "Bad faith"] },
  { id: "pra", ideas: ["Truth"] },
  { id: "emp", ideas: [] },
];

describe("progress per school", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 27, 10, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("empty history: nothing started, everything to go", () => {
    const t = threadProgress({}, SCHOOLS);
    expect(t).toEqual({ explored: 0, started: 0, toGo: 4, rows: [] });
    expect(begunLine(t)).toBe("0 of 4 schools started");
    expect(detailLine(t)).toBe("");
    expect(begunLine(threadProgress(withHistory({}, []), []))).toBe("0 of 0 schools started");
  });

  it("opening starts a school; opening every idea explores it (normal case)", () => {
    let p: Progress = touchSchool({}, "exi");
    expect(stateOf(p.exi, SCHOOLS[1].ideas)).toBe("started");
    vi.setSystemTime(new Date(2026, 10, 27, 10, 5));
    p = touchSchool(p, "sto");
    p = seeIdea(p, "sto", "Virtue");
    p = seeIdea(p, "sto", "Virtue"); // opened twice counts once
    expect(p.sto.ideas).toEqual(["Virtue"]);
    p = seeIdea(p, "sto", "Fate");
    expect(stateOf(p.sto, SCHOOLS[0].ideas)).toBe("explored");
    const t = threadProgress(p, SCHOOLS);
    expect(t.rows.map((r) => [r.id, r.state, r.seen, r.total])).toEqual([["sto", "explored", 2, 2], ["exi", "started", 0, 3]]);
    expect(begunLine(t)).toBe("2 of 4 schools started");
    expect(detailLine(t)).toBe("1 with all ideas seen");
    expect(stateLabel("explored")).toBe("all ideas seen");
    expect(stateLabel("new")).toBe("");
  });

  it("an explored school opened again stays explored and moves to the top", () => {
    let p: Progress = seeIdea(seeIdea({}, "sto", "Virtue"), "sto", "Fate");
    vi.setSystemTime(new Date(2026, 10, 27, 11, 0));
    p = touchSchool(p, "exi");
    vi.setSystemTime(new Date(2026, 10, 28, 0, 0, 30)); // just past midnight
    p = touchSchool(p, "sto");
    const t = threadProgress(p, SCHOOLS);
    expect(t.rows[0]).toMatchObject({ id: "sto", state: "explored", seen: 2 });
    expect(t.rows[1].id).toBe("exi");
  });

  it("a school with no ideas yet can be started but not explored", () => {
    const p = touchSchool({}, "emp");
    expect(stateOf(p.emp, [])).toBe("started");
  });

  it("renamed ideas don't count towards explored", () => {
    const p = seeIdea(seeIdea({}, "sto", "Virtue"), "sto", "Old name");
    expect(stateOf(p.sto, SCHOOLS[0].ideas)).toBe("started");
    expect(threadProgress(p, SCHOOLS).rows[0].seen).toBe(1);
  });

  it("migration: schools in the old visit history count as started, at their last visit", () => {
    const visits: Visit[] = [
      { kind: "school", id: "pra", at: at(2026, 10, 31, 23, 30) },
      { kind: "school", id: "pra", at: at(2026, 11, 1, 0, 30) }, // month end, next day
      { kind: "thinker", id: "pra/james", at: at(2026, 11, 1, 0, 31) },
      { kind: "school", id: "sto", at: at(2026, 11, 2) },
    ];
    let p = withHistory({}, visits);
    expect(p.pra).toEqual({ at: at(2026, 11, 1, 0, 30), ideas: [] });
    expect(Object.keys(p)).toEqual(["pra", "sto"]);
    // newer progress wins over an older visit, and its ideas are kept
    p = withHistory(seeIdea({}, "sto", "Virtue"), visits);
    expect(p.sto).toEqual({ at: new Date(2026, 10, 27, 10, 0).toISOString(), ideas: ["Virtue"] });
    const t = threadProgress(p, SCHOOLS);
    expect(begunLine(t)).toBe("2 of 4 schools started");
    expect(detailLine(t)).toBe("");
  });

  it("all explored", () => {
    let p: Progress = {};
    for (const s of SCHOOLS.slice(0, 3)) for (const i of s.ideas) p = seeIdea(p, s.id, i);
    const t = threadProgress(p, SCHOOLS.slice(0, 3));
    expect(begunLine(t)).toBe("3 of 3 schools started");
    expect(detailLine(t)).toBe("3 with all ideas seen");
  });
});
