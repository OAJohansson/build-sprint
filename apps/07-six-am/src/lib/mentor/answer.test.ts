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
  it("a pick's link must name the pick; otherwise, or when reused, it becomes a SoundCloud search (Re-run 4)", () => {
    const searchUrls = new Set([urlKey("https://soundcloud.com/a/real-track/"), urlKey("https://www.youtube.com/watch?v=x1")]);
    const searchTitles = new Map([[urlKey("https://soundcloud.com/a/real-track"), "Real Track by Artist A | SoundCloud"], [urlKey("https://www.youtube.com/watch?v=x1"), "FETISH - Something Deeper"]]);
    const r = checkAnswer("listen_next", {
      ...ok,
      listenNext: [
        { artist: "Artist A", title: "Real Track", url: "https://soundcloud.com/a/real-track", because: "same groove", kind: "track" },
        { artist: "Lay-Far", title: "Submerging (Crackazat Rework)", url: "https://www.youtube.com/watch?v=x1", because: "deep", kind: "playlist" },
        { artist: "B", title: "Invented", url: "https://soundcloud.com/b/nope", because: "?", kind: "track" },
        { artist: "Artist A", title: "Real Track", url: "https://soundcloud.com/a/real-track", because: "again", kind: "track" },
      ],
    }, { searchUrls, searchTitles });
    expect(r.ok && r.answer.listenNext?.map((x) => x.kind)).toEqual(["track", "search", "search"]);
    expect(r.ok && r.answer.listenNext?.[1].url).toBe("https://soundcloud.com/search?q=Lay-Far%20Submerging%20(Crackazat%20Rework)");
  });
  it("where picks came from is web, not general; uploader tags and Ears numbers don't share a sentence", () => {
    expect(checkAnswer("listen_next", { sentences: [{ text: "I took these from a similar-songs list.", source: "general" }], tellMore: false }).ok).toBe(false);
    expect(checkAnswer("explain", { sentences: [{ text: "Ears measured 126 BPM and the uploader tags it Latin House.", source: "ears" }], tellMore: false }).ok).toBe(false);
    expect(checkAnswer("explain", { sentences: [{ text: "The uploader calls it a 128 BPM edit.", source: "uploader" }], tellMore: false }).ok).toBe(false);
  });
  it("ear training anchors to Ears' snippet times when there are two or more", () => {
    const snippetTimes = new Map([["id1", ["0:58", "1:57", "2:55"]]]);
    const trackRefs = new Map([["T1", "id1"]]);
    const ear = (texts: string[]) => checkAnswer("chat", { intent: "ear_training", trackIds: ["T1"], sentences: texts.map((text) => ({ text, source: "ears" })), tellMore: false }, { snippetTimes, trackRefs });
    expect(ear(["Early on, notice the kick.", "Near the end, notice the hats."]).ok).toBe(false);
    expect(ear(["Around 0:58 Ears heard House: notice the kick.", "Around 2:55 it leans Techno: notice drier drums."]).ok).toBe(true);
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
  it("chat answers are checked by their intent's rules; track refs map to ids (L86, L87)", () => {
    const trackRefs = new Map([["T1", "https://soundcloud.com/a/one"], ["T2", "https://soundcloud.com/b/two"]]);
    expect(checkAnswer("chat", { ...ok, intent: "suggest_genre", trackIds: ["T2"] }, { trackRefs }).ok).toBe(false);
    const r = checkAnswer("chat", { ...ok, intent: "suggest_genre", trackIds: ["t2", "T9"], genre: { name: "Bass house", reason: "Soft call." } }, { trackRefs });
    expect(r.ok && r.answer.trackIds).toEqual(["https://soundcloud.com/b/two"]);
    expect(r.ok && r.answer.intent).toBe("suggest_genre");
    // taste_session and groups are chat-shaped: no groups needed; unknown intents read as chat.
    expect(checkAnswer("chat", { ...ok, intent: "propose_groups" }).ok).toBe(true);
    const odd = checkAnswer("chat", { ...ok, intent: "dance" });
    expect(odd.ok && odd.answer.intent).toBe("chat");
  });
  it("listen next picks are named tracks, never charts (F2); ear training quotes only real tempos (F4)", () => {
    const pick = (artist: string, title: string) => ({ ...ok, listenNext: [{ artist, title, url: "https://x.com/t", because: "same rolling feel", kind: "chart" }] });
    expect(checkAnswer("listen_next", pick("Beatport", "Top 100 Techno")).ok).toBe(false);
    expect(checkAnswer("listen_next", pick("Various Artists", "Warehouse Sessions")).ok).toBe(false);
    const r = checkAnswer("listen_next", pick("Some Artist", "Real Track"));
    expect(r.ok && r.answer.listenNext?.[0].kind).toBe("chart");
    const ear = (text: string) => checkAnswer("chat", { intent: "ear_training", sentences: [{ text, source: "ears" }], tellMore: false }, { bpms: [125.9, 63] });
    expect(ear("Around 1:00, the kick sits on every beat at 125.9 BPM.").ok).toBe(true);
    expect(ear("Half time would be 62.9 BPM.").ok).toBe(true);
    expect(ear("Half time would be 61 BPM.").ok).toBe(false);
  });
});
