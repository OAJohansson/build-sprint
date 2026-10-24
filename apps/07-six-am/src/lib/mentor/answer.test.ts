import { describe, expect, it } from "vitest";
import { checkAnswer, urlKey } from "./answer";

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
