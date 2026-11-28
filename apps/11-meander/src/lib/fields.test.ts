import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getField } from "./content";
import { nextFromHere } from "./next";
import { forField, seeIdea, storageKeys, threadProgress, touchSchool, type Progress } from "./progress";
import { addVisit, type Visit } from "./visits";
import { MUSIC_ERAS, eraOf, makeScale, timelineRows } from "./timeline";
import { parseSpan } from "./years";

const philosophy = getField("philosophy");
const music = getField("music");
const has = (f: typeof music) => ({ school: (id: string) => !!f.getSchool(id), thinker: (id: string) => !!f.getThinker(id) });
const ideas = (f: typeof music) => f.schools.map((s) => ({ id: s.id, ideas: s.themes.map((t) => t.name) }));
const genre = music.schools[0];
const school = philosophy.schools[0];

describe("progress per field (phase 4)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 27, 23, 59, 30)); // a minute before midnight
  });
  afterEach(() => vi.useRealTimers());

  it("philosophy keeps its old keys; music gets its own", () => {
    expect(storageKeys("philosophy")).toEqual({ visits: "11-meander:visits", progress: "11-meander:progress" });
    expect(storageKeys("music")).toEqual({ visits: "11-meander:music:visits", progress: "11-meander:music:progress" });
  });

  it("a genre opened in music never counts towards philosophy (normal case)", () => {
    let visits: Visit[] = addVisit([], "school", genre.id);
    visits = addVisit(visits, "thinker", genre.thinkers[0]);
    let p: Progress = touchSchool({}, genre.id);
    p = seeIdea(p, genre.id, genre.themes[0].name);
    // even if a value lands under philosophy's keys by mistake, philosophy reads none of it
    const asPhilosophy = forField({ visits, progress: p }, has(philosophy));
    expect(asPhilosophy.visits).toEqual([]);
    expect(asPhilosophy.progress).toEqual({});
    const t = threadProgress(asPhilosophy.progress, ideas(philosophy));
    expect(t.rows).toEqual([]);
    expect(t.toGo).toBe(philosophy.schools.length);
    // and music sees it as begun
    const asMusic = forField({ visits, progress: p }, has(music));
    expect(threadProgress(asMusic.progress, ideas(music)).rows.map((r) => r.id)).toEqual([genre.id]);
  });

  it("a school opened in philosophy never counts towards music, nor steers its Next from here", () => {
    vi.setSystemTime(new Date(2026, 10, 28, 0, 0, 30)); // just past midnight
    const visits: Visit[] = addVisit([], "school", school.id);
    const p: Progress = touchSchool({}, school.id);
    const asMusic = forField({ visits, progress: p }, has(music));
    expect(asMusic.visits).toEqual([]);
    const t = threadProgress(asMusic.progress, ideas(music));
    expect(t.rows).toEqual([]);
    const next = nextFromHere(t.rows.map((r) => r.id), music.links, music.schools.map((s) => s.id));
    expect(next.mode).toBe("start");
    for (const pick of next.picks) expect(music.getSchool(pick.id)).toBeDefined();
  });

  it("empty or broken storage reads as nothing begun", () => {
    expect(forField({ visits: null, progress: "x" }, has(music))).toEqual({ visits: [], progress: {} });
    expect(forField({ visits: [], progress: [] }, has(philosophy))).toEqual({ visits: [], progress: {} });
  });
});

describe("music timeline years (1900 to today)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59)); // year end
  });
  afterEach(() => vi.useRealTimers());

  it("reads a genre's sourced range (normal case and edges)", () => {
    expect(parseSpan("Early 1980s–present")).toEqual({ from: 1980, to: "present" });
    expect(parseSpan("Early 1970s – early 1980s")).toEqual({ from: 1970, to: 1983 });
    expect(parseSpan("Mid-1970s to late 1980s")).toEqual({ from: 1974, to: 1989 });
    expect(parseSpan("c. 1920–1940")).toEqual({ from: 1920, to: 1940 });
    expect(parseSpan("Late 19th century – 1920s")).toEqual({ from: 1870, to: 1929 });
    expect(parseSpan("Mid-1980s")).toEqual({ from: 1984, to: "present" });
    expect(parseSpan("")).toBeNull();
    expect(parseSpan("unknown")).toBeNull();
  });

  it("places music years on its own eras, the 80s and 90s widest", () => {
    expect(MUSIC_ERAS.reduce((s, e) => s + e.share, 0)).toBeCloseTo(1);
    expect(eraOf(1899, MUSIC_ERAS)).toBe(0);
    expect(eraOf(1945, MUSIC_ERAS)).toBe(1);
    expect(eraOf(1979, MUSIC_ERAS)).toBe(2);
    expect(eraOf(1980, MUSIC_ERAS)).toBe(3);
    expect(eraOf(2026, MUSIC_ERAS)).toBe(4);
    const { scale, bands } = makeScale(0, 1000, undefined, MUSIC_ERAS);
    expect(scale(1900)).toBe(0);
    expect(scale(1850)).toBe(0); // before the axis: held at its start
    expect(scale(2026)).toBeCloseTo(1000);
    expect(Math.max(...bands.map((b) => b.w))).toBeCloseTo(bands[3].w);
    const xs = [1900, 1944, 1945, 1965, 1980, 1999, 2000, 2026].map(scale);
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
  });

  it("every music genre with years lands on the music axis", () => {
    const rows = timelineRows(music.schools, undefined, music.spans, music.eras);
    for (const r of rows) {
      expect(r.span.from).toBeGreaterThanOrEqual(1900);
      expect(r.span.to).toBeLessThanOrEqual(2026);
    }
  });
});
