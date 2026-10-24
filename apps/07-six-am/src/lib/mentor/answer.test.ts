import { describe, expect, it } from "vitest";
import { checkAnswer, isDownloadLink, linkKind, urlKey } from "./answer";

const ok = { sentences: [{ text: "Ears measured 128 BPM.", source: "ears" }], tellMore: true };

describe("checkAnswer", () => {
  it("accepts a labelled answer", () => {
    const r = checkAnswer("explain", ok);
    expect(r.ok && r.answer.sentences[0].source).toBe("ears");
  });
  it("rejects a sentence with a missing or unknown source", () => {
    expect(checkAnswer("explain", { sentences: [{ text: "It's a banger." }], tellMore: false }).ok).toBe(false);
    expect(checkAnswer("explain", { sentences: [{ text: "x", source: "vibes" }], tellMore: false }).ok).toBe(false);
  });
  it("rejects a web fact without a url, and an empty or missing sentences list", () => {
    expect(checkAnswer("teach", { sentences: [{ text: "Born in 1985.", source: "web" }], tellMore: true }).ok).toBe(false);
    expect(checkAnswer("explain", { sentences: [], tellMore: false }).ok).toBe(false);
    expect(checkAnswer("explain", null).ok).toBe(false);
  });
  it("keeps everyday answers to 4 sentences (teach may run longer) and rejects raw figures (F2, F8)", () => {
    const five = { sentences: Array.from({ length: 5 }, (_, i) => ({ text: `Fact ${i}.`, source: "general" })), tellMore: true };
    expect(checkAnswer("explain", five).ok).toBe(false);
    expect(checkAnswer("teach", five).ok).toBe(true);
    for (const bad of ["Its spectral centroid is 2329 Hz.", "It sits at -28.8 dBFS.", "Key strength 0.66 says G major.", "Brightness of 1.5 kHz."]) {
      expect(checkAnswer("explain", { sentences: [{ text: bad, source: "ears" }], tellMore: false }).ok, bad).toBe(false);
    }
    expect(checkAnswer("explain", { sentences: [{ text: "Ears measured 126 BPM and Tech House at 47%.", source: "ears" }], tellMore: false }).ok).toBe(true);
  });
  it("library is its own source (F9); listen next keeps 3 picks, track pages first", () => {
    expect(checkAnswer("explain", { sentences: [{ text: "You tagged it Tech house.", source: "library" }], tellMore: false }).ok).toBe(true);
    const item = (n: number, kind: string) => ({ artist: `A${n}`, title: `T${n}`, url: `https://x.com/${n}`, because: "b", kind });
    const r = checkAnswer("listen_next", { ...ok, listenNext: [item(1, "article"), item(2, "track"), item(3, "playlist"), item(4, "track")] });
    expect(r.ok && r.answer.listenNext?.map((x) => x.title)).toEqual(["T2", "T4", "T1"]);
  });
  it("a profile update must keep the person's own lines; listen-next reasons give no BPM or key numbers", () => {
    const q = { question: "Vocals?", options: [{ label: "Yes" }, { label: "No" }] };
    const draft = (text: string) => ({ ...ok, questions: [q, q, q], profileUpdate: { text, note: "draft" } });
    const keepLines = ["I love piano house."];
    expect(checkAnswer("setup", draft("You like hard bounce."), { keepLines }).ok).toBe(false);
    expect(checkAnswer("setup", draft("I love piano house. You like hard bounce."), { keepLines }).ok).toBe(true);
    const pick = (because: string) => ({ ...ok, listenNext: [{ artist: "A", title: "T", url: "https://x.com/t", because, kind: "track" }] });
    for (const bad of ["Same 124 BPM groove.", "Also in 8A.", "Sits in F minor too."]) expect(checkAnswer("listen_next", pick(bad)).ok, bad).toBe(false);
    expect(checkAnswer("listen_next", pick("A similar tempo and the same warm, rolling feel.")).ok).toBe(true);
  });
  it("drops picks that link to download sites; setup names what it's missing", () => {
    for (const u of ["https://edmdls.com/x", "https://freemp3cloud.com/t", "https://soundcloud.com/a/t.mp3"]) expect(isDownloadLink(u), u).toBe(true);
    for (const u of ["https://soundcloud.com/a/t", "https://artist.bandcamp.com/track/t", "https://www.beatport.com/track/t/1", "https://www.discogs.com/release/1"]) expect(isDownloadLink(u), u).toBe(false);
    const r = checkAnswer("listen_next", { ...ok, listenNext: [{ artist: "A", title: "T", url: "https://edmdls.com/t", because: "same feel", kind: "track" }] });
    expect(r.ok && r.answer.listenNext).toEqual([]);
    const s = checkAnswer("setup", { ...ok, profileUpdate: { text: "You like bounce.", note: "draft" } });
    expect(!s.ok && s.problem).toMatch(/missing questions/);
  });
  it("profiles are artist pages, sets are playlists (N4); Studio start has no key jargon (N5)", () => {
    expect(linkKind("https://soundcloud.com/someartist", "article")).toBe("artist");
    expect(linkKind("https://someartist.bandcamp.com/", "article")).toBe("artist");
    expect(linkKind("https://soundcloud.com/a/sets/b", "article")).toBe("playlist");
    expect(linkKind("https://soundcloud.com/a/track", "track")).toBe("track");
    const studio = (text: string) => checkAnswer("studio_start", { sentences: [{ text, source: "ears" }], tellMore: false, loops: [{ id: "x", why: "" }] });
    expect(studio("It's 2 semitones above A.").ok).toBe(false);
    expect(studio("Ears read it as 9A.").ok).toBe(false);
  });
  it("suggest_genre needs a genre; studio_start needs a real loop", () => {
    expect(checkAnswer("suggest_genre", ok).ok).toBe(false);
    expect(checkAnswer("suggest_genre", { ...ok, genre: { name: "Bass house", reason: "Most likely, given the styles." } }).ok).toBe(true);
    const loopIds = new Set(["deep-sub"]);
    expect(checkAnswer("studio_start", { ...ok, loops: [{ id: "fake", why: "" }] }, { loopIds }).ok).toBe(false);
    const r = checkAnswer("studio_start", { ...ok, loops: [{ id: "fake", why: "" }, { id: "deep-sub", why: "warm" }] }, { loopIds });
    expect(r.ok && r.answer.loops).toEqual([{ id: "deep-sub", why: "warm" }]);
  });
  it("drops listen-next links that weren't in this answer's search results", () => {
    const searchUrls = new Set([urlKey("https://soundcloud.com/a/real-track/")]);
    const r = checkAnswer("listen_next", {
      ...ok,
      listenNext: [
        { artist: "A", title: "Real", url: "https://soundcloud.com/a/real-track", because: "same groove" },
        { artist: "B", title: "Invented", url: "https://soundcloud.com/b/nope", because: "?" },
      ],
    }, { searchUrls });
    expect(r.ok && r.answer.listenNext?.map((x) => x.title)).toEqual(["Real"]);
    expect(r.ok && r.dropped.length).toBe(1);
  });
  it("setup needs a profile draft and 3+ tap questions; notes get the Updated: prefix", () => {
    const q = { question: "Do vocals matter?", options: [{ label: "Yes" }, { label: "No" }] };
    expect(checkAnswer("setup", { ...ok, questions: [q, q] , profileUpdate: { text: "x", note: "first draft" } }).ok).toBe(false);
    const r = checkAnswer("setup", { ...ok, questions: [q, q, q], profileUpdate: { text: "Likes long builds.", note: "first draft" } });
    expect(r.ok && r.answer.profileUpdate?.note).toBe("Updated: first draft");
  });
  it("group proposals keep only known track ids and need two tracks", () => {
    const trackIds = new Set(["t1", "t2"]);
    const r = checkAnswer("propose_groups", { ...ok, groups: [
      { name: "Warm 122", reason: "122–124 BPM, warm", trackIds: ["t1", "t2", "t9"] },
      { name: "Lonely", reason: "one track", trackIds: ["t1"] },
    ] }, { trackIds });
    expect(r.ok && r.answer.groups).toEqual([{ name: "Warm 122", reason: "122–124 BPM, warm", trackIds: ["t1", "t2"] }]);
  });
});
