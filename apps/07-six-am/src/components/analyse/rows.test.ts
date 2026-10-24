import { describe, expect, it } from "vitest";
import { appendToSource, type Source } from "./rows";

const a = { url: "https://soundcloud.com/x/a", trackId: 1, title: "A" };
const b = { url: "https://soundcloud.com/x/b", trackId: 2, title: "B" };
const c = { url: "https://soundcloud.com/x/c", title: "C" };

describe("appendToSource", () => {
  it("first paste starts the list", () => {
    const { source, added } = appendToSource(null, [a, b], "https://soundcloud.com/x/sets/s", "set");
    expect(source.tracks.map((t) => t.title)).toEqual(["A", "B"]);
    expect(source.kind).toBe("set");
    expect(added).toBe(2);
  });

  it("a second link adds to the end and skips repeats (by id, or by link)", () => {
    const prev: Source = { version: 1, url: "u", kind: "set", tracks: [a, b, c] };
    const again = [
      { url: "https://api.soundcloud.com/tracks/2", trackId: 2, title: "B fresher" },
      { url: "https://soundcloud.com/X/c/?si=123", title: "C again" },
      { url: "https://soundcloud.com/x/d", trackId: 4, title: "D" },
    ];
    const { source, added } = appendToSource(prev, again, "u2", "set");
    expect(added).toBe(1);
    expect(source.tracks.map((t) => t.title)).toEqual(["A", "B fresher", "C again", "D"]);
    expect(source.tracks[1].url).toBe(b.url); // keeps its place and link
    expect(source.kind).toBe("list");
    expect(source.url).toBe("u");
  });

  it("pasting the same single track again changes nothing", () => {
    const prev: Source = { version: 1, url: a.url, kind: "track", tracks: [a] };
    const { source, added } = appendToSource(prev, [a], a.url, "track");
    expect(added).toBe(0);
    expect(source.kind).toBe("track");
    expect(source.tracks).toHaveLength(1);
  });
});
