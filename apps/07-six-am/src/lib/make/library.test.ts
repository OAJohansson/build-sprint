import { describe, expect, it } from "vitest";
import { normalizeTags, saveAction, soundId, parseNewSound, parseSoundPatch, shortTitle, soundWord, suggestName, suggestTags } from "./library";
import { MAKE_PRESETS } from "./presets";

const SONG = "It Just Won't Do (Mason Flint Remix) [feat. Sam Obernik]";
const URL = "https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix";

describe("normalizeTags", () => {
  it("lower-cases, trims, collapses spaces and drops duplicates and empties", () => {
    expect(normalizeTags(["  Bass ", "bass", "A  Minor", "", "#Sub,", 124, "Deep_House"])).toEqual(["bass", "a minor", "sub", "124", "deep house"]);
  });
  it("caps tag length and count, and skips non-text", () => {
    const many = Array.from({ length: 20 }, (_, i) => `tag ${i}`);
    expect(normalizeTags(many)).toHaveLength(12);
    expect(normalizeTags(["x".repeat(50)])[0]).toHaveLength(32);
    expect(normalizeTags([null, {}, ["a"], "ok"])).toEqual(["ok"]);
  });
});

describe("shortTitle and the suggested name", () => {
  it("keeps the song's own title", () => {
    expect(shortTitle(SONG)).toBe("It Just Won't Do");
    expect(shortTitle("Lost in The Loop feat. Anneliese")).toBe("Lost in The Loop");
    expect(shortTitle("Track - Extended Mix")).toBe("Track");
    expect(shortTitle("(Untitled)")).toBe("(Untitled)");
    expect(shortTitle("A very long title that goes on and on past the field")).toBe("A very long title that goes on…");
  });
  it("names the sound by its character, then the song", () => {
    expect(suggestName("bass", "rubber-pluck", MAKE_PRESETS["rubber-pluck"].macros, SONG)).toBe("Rubbery bass, from It Just Won't Do");
    expect(suggestName("bass", "round-sub", MAKE_PRESETS["round-sub"].macros, null)).toBe("Deep bass");
    expect(soundWord("reese", { ...MAKE_PRESETS.reese.macros, drive: 0.8 })).toBe("Gritty");
    expect(suggestName("bass", "reese", MAKE_PRESETS.reese.macros, "x".repeat(80)).length).toBeLessThanOrEqual(60);
  });
  it("tags part, preset, key, tempo and song", () => {
    expect(suggestTags("bass", "acid-line", "A", "minor", 124.4, SONG)).toEqual(["bass", "squelchy", "resonant", "a minor", "124 bpm", "it just won't do"]);
  });
});

describe("parseNewSound", () => {
  const good = {
    part: "bass", preset: "reese", macros: { tone: 0.4, width: 9 }, key: "A", scale: "minor", bpm: 124,
    pattern: { bars: 2, notes: [{ step: 18, midi: 31, dur: 2, vel: 0.8 }, { step: 2, midi: 33, dur: 2, vel: 0.9 }] },
    source: { url: URL, title: SONG }, audio: "AAAA", pcm: [1, 2, 3],
  };
  it("keeps settings and measurements only, fills name and tags", () => {
    const s = parseNewSound(good)!;
    expect(s).not.toHaveProperty("audio");
    expect(s).not.toHaveProperty("pcm");
    expect(s.macros).toEqual({ ...MAKE_PRESETS.reese.macros, tone: 0.4, width: 1 });
    expect(s.pattern.notes.map((n) => n.step)).toEqual([2, 18]);
    expect(s.name).toBe("Wide bass, from It Just Won't Do");
    expect(s.tags).toContain("a minor");
  });
  it("rejects what doesn't fit", () => {
    expect(parseNewSound({ ...good, preset: "theremin" })).toBeNull();
    expect(parseNewSound({ ...good, key: "H" })).toBeNull();
    expect(parseNewSound({ ...good, pattern: { bars: 3, notes: [] } })).toBeNull();
    expect(parseNewSound({ ...good, pattern: { bars: 1, notes: [{ step: 16, midi: 33, dur: 1, vel: 1 }] } })).toBeNull(); // past the loop
    expect(parseNewSound({ ...good, source: { url: "https://evil.example/x", title: "x" } })!.source).toBeNull();
  });
  it("renames and retags; keeps a rename tidy", () => {
    expect(parseSoundPatch({ name: "  rubber   sub  ", tags: ["Sub", "sub"], audio: "x" }, { preset: "round-sub" })).toEqual({ name: "rubber sub", tags: ["sub"] });
    expect(parseSoundPatch({ name: "   " }, { preset: "round-sub" })).toEqual({});
  });
});

describe("saving from Make (S5-1)", () => {
  const m = MAKE_PRESETS["rubber-pluck"].macros;
  const sound = soundId("rubber-pluck", m);
  it("names a sound by preset and knobs, not by name", () => {
    expect(soundId("rubber-pluck", { ...m })).toBe(sound);
    expect(soundId("rubber-pluck", { ...m, tone: m.tone + 0.05 })).not.toBe(sound);
    expect(soundId("reese", m)).not.toBe(sound);
  });
  it("posts a new sound, renames a saved one, or does nothing", () => {
    expect(saveAction({ sound, name: "Rubber sub" }, null)).toEqual({ kind: "post" });
    const last = { id: "s1", sound, name: "Rubbery bass, from X" };
    expect(saveAction({ sound, name: " Rubbery bass,  from X " }, last)).toEqual({ kind: "none" });
    expect(saveAction({ sound, name: "Rubber sub" }, last)).toEqual({ kind: "patch", id: "s1" });
    expect(saveAction({ sound, name: "" }, last)).toEqual({ kind: "none" });
    expect(saveAction({ sound: soundId("reese", m), name: "Rubber sub" }, last)).toEqual({ kind: "post" });
  });
});
