import { describe, expect, it } from "vitest";
import { rankStyles, styleDisplayName, styleLabels, styleParent, UNKNOWN_STYLE } from "./styles";

describe("styleDisplayName", () => {
  it("drops the parent genre", () => {
    expect(styleDisplayName("Electronic---Deep House")).toBe("Deep House");
    expect(styleDisplayName("Folk, World, & Country---Fado")).toBe("Fado");
    expect(styleDisplayName("Funk / Soul---Rhythm & Blues")).toBe("Rhythm & Blues");
  });
  it("falls back for unknown or malformed names", () => {
    expect(styleDisplayName("Deep House")).toBe("Deep House");
    expect(styleDisplayName("  Electronic---Hard House  ")).toBe("Hard House");
    expect(styleDisplayName("Electronic---")).toBe("Electronic");
    expect(styleDisplayName("Electronic----Donk")).toBe("Donk");
    expect(styleDisplayName("")).toBe(UNKNOWN_STYLE);
    expect(styleDisplayName(undefined)).toBe(UNKNOWN_STYLE);
    expect(styleDisplayName("---")).toBe(UNKNOWN_STYLE);
  });
});

describe("styleParent", () => {
  it("returns the genre or null", () => {
    expect(styleParent("Electronic---Deep House")).toBe("Electronic");
    expect(styleParent("Deep House")).toBeNull();
    expect(styleParent("---Donk")).toBeNull();
  });
});

describe("styleLabels", () => {
  it("adds the parent only when two names collide", () => {
    expect(styleLabels(["Electronic---Hardcore", "Electronic---Hard House", "Rock---Hardcore"])).toEqual([
      "Hardcore (Electronic)",
      "Hard House",
      "Hardcore (Rock)",
    ]);
    expect(styleLabels(["Reggae---Dub", "Electronic---Techno"])).toEqual(["Dub", "Techno"]);
  });
});

describe("rankStyles", () => {
  it("sorts by probability and breaks ties alphabetically", () => {
    const ranked = rankStyles([
      { style: "Electronic---Techno", p: 0.2 },
      { style: "Electronic---House", p: 0.2 },
      { style: "Electronic---Donk", p: 0.3 },
    ]);
    expect(ranked.map((s) => styleDisplayName(s.style))).toEqual(["Donk", "House", "Techno"]);
  });
});
