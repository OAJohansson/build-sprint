import { describe, expect, it } from "vitest";
import { matchesFilters, NO_FILTERS, NO_GENRE, parseBound, sanitiseFilters, type Filters } from "./filters";
import { canonicalGenre, genreKey, genreSuggestions, usedGenres, withMyGenre } from "./my-genre";
import type { EarsAnalysis } from "./results";

const steady = (bpm: number, myGenre?: string) => ({ bpm, bpmAlternative: null, bpmAmbiguous: false, myGenre });
// The engine heard 72.5; 145 is about as likely (the lead becomes 145).
const halfUnclear = { bpm: 72.5, bpmAlternative: { bpm: 145, relation: "2:1" as const }, bpmAmbiguous: true };
// An alternative the engine thinks less likely: matches on the main reading only.
const halfLikely = { bpm: 124, bpmAlternative: { bpm: 62, relation: "1:2" as const }, bpmAmbiguous: false };
const f = (x: Partial<Filters>): Filters => ({ ...NO_FILTERS, ...x });

describe("matchesFilters: BPM range", () => {
  it("normal range, bounds inclusive", () => {
    const r = f({ bpmMin: 120, bpmMax: 126 });
    expect(matchesFilters(steady(122), r)).toBe(true);
    expect(matchesFilters(steady(120), r)).toBe(true);
    expect(matchesFilters(steady(126), r)).toBe(true);
    expect(matchesFilters(steady(128), r)).toBe(false);
    expect(matchesFilters(steady(119.9), r)).toBe(false);
    // Compared at the one decimal the table shows: 126.04 reads 126.0.
    expect(matchesFilters(steady(126.04), r)).toBe(true);
  });

  it("open-ended on either side; reversed bounds read as the range between", () => {
    expect(matchesFilters(steady(150), f({ bpmMin: 140 }))).toBe(true);
    expect(matchesFilters(steady(130), f({ bpmMin: 140 }))).toBe(false);
    expect(matchesFilters(steady(100), f({ bpmMax: 110 }))).toBe(true);
    expect(matchesFilters(steady(122), f({ bpmMin: 126, bpmMax: 120 }))).toBe(true);
  });

  it("an unclear half/double track matches on either reading", () => {
    expect(matchesFilters(halfUnclear, f({ bpmMin: 140, bpmMax: 150 }))).toBe(true);
    expect(matchesFilters(halfUnclear, f({ bpmMin: 70, bpmMax: 75 }))).toBe(true);
    expect(matchesFilters(halfUnclear, f({ bpmMin: 120, bpmMax: 126 }))).toBe(false);
    expect(matchesFilters(halfLikely, f({ bpmMin: 60, bpmMax: 65 }))).toBe(false);
    expect(matchesFilters(halfLikely, f({ bpmMin: 120, bpmMax: 126 }))).toBe(true);
  });

  it("rows without a result are hidden only while a range is set", () => {
    expect(matchesFilters(undefined, NO_FILTERS)).toBe(true);
    expect(matchesFilters(undefined, f({ bpmMin: 120 }))).toBe(false);
  });
});

describe("matchesFilters: my genre", () => {
  it("one genre, case-insensitive; No genre yet; not-analysed rows hidden by any genre filter", () => {
    expect(matchesFilters(steady(122, "Tech house"), f({ genre: "tech house" }))).toBe(true);
    expect(matchesFilters(steady(122, "Deep house"), f({ genre: "Tech house" }))).toBe(false);
    expect(matchesFilters(steady(122), f({ genre: "Tech house" }))).toBe(false);
    expect(matchesFilters(steady(122), f({ genre: NO_GENRE }))).toBe(true);
    expect(matchesFilters(steady(122, "  "), f({ genre: NO_GENRE }))).toBe(true);
    expect(matchesFilters(steady(122, "Tech house"), f({ genre: NO_GENRE }))).toBe(false);
    expect(matchesFilters(undefined, f({ genre: NO_GENRE }))).toBe(false);
  });

  it("BPM range and genre combine (AND)", () => {
    const both = f({ bpmMin: 120, bpmMax: 126, genre: "Tech house" });
    expect(matchesFilters(steady(124, "Tech house"), both)).toBe(true);
    expect(matchesFilters(steady(128, "Tech house"), both)).toBe(false);
    expect(matchesFilters(steady(124, "Deep house"), both)).toBe(false);
    expect(matchesFilters({ ...halfUnclear, myGenre: "Hard trance" }, f({ bpmMin: 70, bpmMax: 75, genre: "Hard trance" }))).toBe(true);
  });
});

describe("parseBound and sanitiseFilters", () => {
  it("empty or nonsense is open-ended", () => {
    expect(parseBound("")).toBeNull();
    expect(parseBound("abc")).toBeNull();
    expect(parseBound("0")).toBeNull();
    expect(parseBound("122,5")).toBe(122.5);
    expect(sanitiseFilters(null)).toEqual(NO_FILTERS);
    expect(sanitiseFilters({ bpmMin: "x", bpmMax: 126, genre: 3 })).toEqual({ bpmMin: null, bpmMax: 126, genre: "" });
  });
});

describe("my genre helpers", () => {
  it("used genres once each, A–Z, then accepted group names; no built-in list (L55)", () => {
    const list = [{ myGenre: "Tech house" }, { myGenre: "tech house" }, { myGenre: "Afro bounce" }, {}];
    expect(usedGenres(list)).toEqual(["Afro bounce", "Tech house"]);
    expect(genreSuggestions(list)).toEqual(["Afro bounce", "Tech house"]);
    expect(genreSuggestions([])).toEqual([]);
    expect(genreSuggestions(list, ["tech-house", "Sunrise vocal house", " "])).toEqual(["Afro bounce", "Tech house", "Sunrise vocal house"]);
  });

  it("withMyGenre trims, and empty clears the field", () => {
    const a = { id: "x", myGenre: "Old" } as EarsAnalysis;
    expect(withMyGenre([a], "x", "  Jackin'  house ")[0].myGenre).toBe("Jackin' house");
    expect("myGenre" in withMyGenre([a], "x", "   ")[0]).toBe(false);
    expect(withMyGenre([a], "y", "New")[0].myGenre).toBe("Old");
  });

  it("genreKey ignores case, spaces and punctuation", () => {
    expect(genreKey("deep  House")).toBe(genreKey("Deep house"));
    expect(genreKey("Deep-house")).toBe(genreKey("Deep house"));
    expect(genreKey("Jackin house")).toBe(genreKey("Jackin' house"));
    expect(genreKey("Tech house")).not.toBe(genreKey("Deep house"));
    expect(genreKey("")).toBe("");
    expect(genreKey("!!")).toBe("!!");
  });

  it("canonicalGenre prefers an existing spelling, else the typed text", () => {
    expect(canonicalGenre("deep  House", ["Deep house"])).toBe("Deep house");
    expect(canonicalGenre("afro BOUNCE", ["Afro bounce"])).toBe("Afro bounce");
    expect(canonicalGenre("tech-house", [])).toBe("tech-house");
    expect(canonicalGenre("  Gqom ", [])).toBe("Gqom");
    expect(canonicalGenre("   ", ["Deep house"])).toBeUndefined();
  });

  it("two spellings of a used genre merge", () => {
    expect(usedGenres([{ myGenre: "Deep house" }, { myGenre: "deep-house" }])).toEqual(["Deep house"]);
    expect(genreSuggestions([{ myGenre: "deep house" }]).filter((x) => genreKey(x) === "deephouse")).toEqual(["deep house"]);
  });
});
