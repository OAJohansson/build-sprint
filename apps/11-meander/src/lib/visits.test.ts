import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addVisit, countLine, formatDay, summarise, type Visit } from "./visits";

// Local-time timestamps, so the tests hold in any time zone.
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
const school = (id: string, iso: string): Visit => ({ kind: "school", id, at: iso });

describe("visit history counts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 13, 10, 0)); // 13 Nov 2026, 10:00 local
  });
  afterEach(() => vi.useRealTimers());

  it("counts distinct schools and days (normal case)", () => {
    const s = summarise([school("sto", at(2026, 11, 3)), school("cla", at(2026, 11, 5)), school("ide", at(2026, 11, 9)), school("exi", at(2026, 11, 13))]);
    expect(s.schools).toBe(4);
    expect(s.days).toBe(4);
    expect(s.since).toBe("2026-11-03");
    expect(s.rows.map((r) => r.day)).toEqual(["2026-11-13", "2026-11-09", "2026-11-05", "2026-11-03"]);
    expect(s.rows[0].isToday).toBe(true);
    expect(countLine(s)).toBe("4 schools on 4 days");
  });

  it("empty history", () => {
    const s = summarise([]);
    expect(s).toEqual({ schools: 0, days: 0, since: null, rows: [] });
    expect(countLine(s)).toBe("0 schools on 0 days");
  });

  it("two visits either side of midnight count as two days", () => {
    const s = summarise([school("exi", at(2026, 11, 12, 23, 59)), school("abs", at(2026, 11, 13, 0, 1))]);
    expect(s.days).toBe(2);
    expect(s.schools).toBe(2);
  });

  it("the same school twice in a day counts once", () => {
    const s = summarise([school("exi", at(2026, 11, 13, 9)), school("exi", at(2026, 11, 13, 18))]);
    expect(s.schools).toBe(1);
    expect(s.days).toBe(1);
    expect(s.rows[0].items).toEqual([{ kind: "school", id: "exi" }]);
    expect(countLine(s)).toBe("1 school on 1 day");
  });

  it("month end: 31 Oct and 1 Nov are two days", () => {
    const s = summarise([school("sto", at(2026, 10, 31, 23, 30)), school("sto", at(2026, 11, 1, 0, 30))]);
    expect(s.days).toBe(2);
    expect(s.schools).toBe(1);
    expect(s.rows.map((r) => formatDay(r.day))).toEqual(["1 Nov", "31 Oct"]);
  });

  it("thinkers add days but not schools", () => {
    const s = summarise([school("exi", at(2026, 11, 12)), { kind: "thinker", id: "bea", at: at(2026, 11, 13) }]);
    expect(s.schools).toBe(1);
    expect(s.days).toBe(2);
  });

  it("addVisit skips a repeat on the same day but records it the next day", () => {
    let v = addVisit([], "school", "exi");
    v = addVisit(v, "school", "exi");
    expect(v).toHaveLength(1);
    vi.setSystemTime(new Date(2026, 10, 14, 0, 0, 30));
    v = addVisit(v, "school", "exi");
    expect(v).toHaveLength(2);
  });
});
