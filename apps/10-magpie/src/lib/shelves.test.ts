import { afterEach, describe, expect, it, vi } from "vitest";
import { applyFilters, homeCity, latestFirst, maggieLine, newThisMonth, NO_FILTERS, smartShelves } from "@/lib/shelves";
import type { Yum } from "@/lib/yum";

let n = 0;
function yum(over: Partial<Yum>): Yum {
  n++;
  return {
    id: `id-${n}`, number: n, name: `Yum ${n}`, kind: "drink", subKind: "wine", place: null, city: null, country: null,
    hearts: 3, note: null, hasPhoto: true, sticker: "ready", savedAt: "2026-10-10T12:00:00.000Z", updatedAt: "2026-10-10T12:00:00.000Z", ...over,
  };
}

// Local times, so the month edges are the phone's month, not UTC's.
const local = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

afterEach(() => vi.useRealTimers());

describe("new this month (Maggie's line)", () => {
  it("counts yums saved since the start of the month", () => {
    vi.setSystemTime(new Date(2026, 9, 1, 0, 0, 1)); // 1 Oct, just after midnight
    const yums = [yum({ savedAt: local(2026, 10, 1, 0, 0) }), yum({ savedAt: local(2026, 9, 30, 23, 59) })];
    expect(newThisMonth(yums)).toHaveLength(1);
  });

  it("counts the last day of the month, including 23:59", () => {
    vi.setSystemTime(new Date(2026, 9, 31, 23, 59, 30));
    const yums = [yum({ savedAt: local(2026, 10, 31, 23, 59) }), yum({ savedAt: local(2026, 11, 1, 0, 0) })];
    expect(newThisMonth(yums)).toHaveLength(1);
  });

  it("a yum at 23:59 on the last day isn't new next month", () => {
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0));
    expect(newThisMonth([yum({ savedAt: local(2026, 10, 31, 23, 59) })])).toHaveLength(0);
  });

  it("says so when the month has no yums", () => {
    vi.setSystemTime(new Date(2026, 10, 15));
    expect(maggieLine([yum({ savedAt: local(2026, 9, 3) })])).toBe("Nothing new this month yet. I'm getting peckish!");
  });

  it("names the biggest group when it has two or more", () => {
    vi.setSystemTime(new Date(2026, 9, 26));
    const yums = [1, 2, 3].map((d) => yum({ savedAt: local(2026, 10, d) })).concat(yum({ kind: "food", subKind: "dishes", savedAt: local(2026, 10, 4) }));
    expect(maggieLine(yums)).toBe("I sorted your shelves. Three new wines this month!");
  });

  it("falls back to yums when every group has one", () => {
    vi.setSystemTime(new Date(2026, 9, 26));
    expect(maggieLine([yum({ savedAt: local(2026, 10, 2) })])).toBe("I sorted your shelves. One new yum this month!");
  });
});

describe("latest order and date saved", () => {
  it("puts two yums saved the same day newest first", () => {
    const a = yum({ savedAt: local(2026, 10, 12, 9) }), b = yum({ savedAt: local(2026, 10, 12, 21) });
    expect(latestFirst([a, b]).map((y) => y.id)).toEqual([b.id, a.id]);
  });

  it("orders two yums with the same moment by yum number", () => {
    const a = yum({ savedAt: local(2026, 10, 12) }), b = yum({ savedAt: local(2026, 10, 12) });
    expect(latestFirst([a, b])[0].id).toBe(b.id);
  });

  it("keeps an edited yum at its saved date", () => {
    const old = yum({ savedAt: local(2026, 10, 1), updatedAt: local(2026, 10, 20) });
    const recent = yum({ savedAt: local(2026, 10, 10) });
    expect(latestFirst([old, recent])[0].id).toBe(recent.id);
  });
});

describe("home city", () => {
  it("is the city with the most yums", () => {
    const yums = [yum({ city: "London" }), yum({ city: "london " }), yum({ city: "Taipei" })];
    expect(homeCity(yums)).toBe("London");
  });

  it("breaks a tie by the most recent yum", () => {
    const yums = [yum({ city: "London", savedAt: local(2026, 10, 1) }), yum({ city: "Taipei", savedAt: local(2026, 10, 9) })];
    expect(homeCity(yums)).toBe("Taipei");
  });

  it("is null with an empty history", () => {
    expect(homeCity([])).toBeNull();
    expect(homeCity([yum({ city: null })])).toBeNull();
  });
});

describe("smart shelves and filters", () => {
  it("hides rows with no yums", () => {
    expect(smartShelves([])).toEqual([]);
    const ids = smartShelves([yum({ hearts: 3, city: null })]).map((s) => s.id);
    expect(ids).toEqual(["latest"]);
  });

  it("fills Your top wines and Around the home city", () => {
    const shelves = smartShelves([yum({ hearts: 5, city: "London" }), yum({ hearts: 5, city: "London" }), yum({ kind: "food", subKind: "dishes", city: "Taipei" })]);
    expect(shelves.map((s) => s.title)).toEqual(["Latest", "Your top wines", "Around London"]);
  });

  it("finds by restaurant and by a word in the note", () => {
    const barolo = yum({ name: "Barolo 2016", place: "Noble Rot", note: "tar and roses" });
    const yums = [barolo, yum({ name: "Chablis" })];
    expect(applyFilters(yums, { ...NO_FILTERS, q: "noble" })).toEqual([barolo]);
    expect(applyFilters(yums, { ...NO_FILTERS, q: "ROSES" })).toEqual([barolo]);
    expect(applyFilters(yums, { ...NO_FILTERS, q: "noble wine" })).toEqual([barolo]);
    // No yum has every word: the ones with some of them, best first.
    expect(applyFilters(yums, { ...NO_FILTERS, q: "red wine" }).map((y) => y.name)).toEqual(["Chablis", "Barolo 2016"]);
  });

  it("narrows by kind, hearts and away, and widens again", () => {
    const a = yum({ hearts: 5, city: "London" }), b = yum({ hearts: 4, city: "London" }), c = yum({ hearts: 5, city: "Paris" });
    const d = yum({ kind: "food", subKind: "dishes", hearts: 5, city: "London" });
    const all = [a, b, c, d];
    expect(applyFilters(all, { ...NO_FILTERS, kind: "drink", sub: "wine", hearts: 4, where: "home" }).map((y) => y.id).sort()).toEqual([a.id, b.id].sort());
    expect(applyFilters(all, { ...NO_FILTERS, where: "away" })).toEqual([c]);
    expect(applyFilters(all, NO_FILTERS)).toHaveLength(4);
  });
});
