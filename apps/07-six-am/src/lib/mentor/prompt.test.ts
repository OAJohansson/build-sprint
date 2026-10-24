import { describe, expect, it } from "vitest";
import type { EarsAnalysis } from "@/lib/ears/results";
import { JOBS, SOURCES } from "./answer";
import { buildRequest, JOBS_SPEC, SYSTEM_PROMPT, type MentorInput } from "./prompt";

// Grader-side list (L50, L55, L59): the genre families of kickoff-source.md Appendix A, kept only
// here to prove no prompt carries them. Never import this into app code.
const APPENDIX_A = [
  "Deep house", "Jazzy deep house", "Raw soulful queer house", "Emotive vocal house", "Tech house", "Minimal deep tech",
  "Jackin' house", "Progressive house", "Melodic house & techno", "High-tech minimal", "Classic house reworks",
  "Pop-club remixes", "Ballroom house", "Hard trance", "Breakbeat", "Tropical house", "Afro house",
];
// Appendix B playlist names (the owner's own; grader-only).
const APPENDIX_B = ["You Are Edging Me", "Old banger remixx", "Back to the Warehouse", "The Category Is", "drum & basssss"];

const track: EarsAnalysis = {
  version: 1, id: "https://soundcloud.com/someone/a-track", soundcloudUrl: "https://soundcloud.com/someone/a-track", trackId: 1,
  title: "A Track", uploader: "someone", uploaderGenreTag: "Electronic", uploaderTags: ["club", "edit"], preview: false,
  durationMs: 300000, analysedSeconds: 120, bpm: 126, bpmConfidence: 3, bpmAlternative: null, bpmAmbiguous: false,
  key: "G", scale: "minor", keyStrength: 0.7, keyRunnerUp: null, energy: 0.8, energyDbfs: -9, brightness: 0.5, brightnessHz: 1500,
  genres: [{ style: "Electronic---House", p: 0.4 }, { style: "Electronic---Disco", p: 0.2 }], snippetPlan: [], snippets: [],
  analysedAt: "2026-10-24T00:00:00Z", myGenre: "Sunday morning",
};

const inputs: MentorInput[] = JOBS.map((job) => ({
  job, profile: "Likes long builds and warm basslines.", track, message: "What should I listen for?",
  history: [{ role: "user", content: "Explain this track" }, { role: "assistant", content: "Ears measured 126 BPM." }],
  myGenres: ["Sunday morning"], groups: [{ name: "Warm 124", reason: "122–126 BPM, warm" }], library: [track, { ...track, id: "https://soundcloud.com/x/y" }],
  playlists: "someone | A Track | Electronic | club | https://soundcloud.com/someone/a-track",
  events: [{ type: "typed_genre", detail: "Sunday morning" }],
  taste: { a: track, b: { ...track, id: "https://soundcloud.com/x/y" }, preferred: "a", why: "rolling bass" },
}));

const promptText = (job: MentorInput["job"]) => {
  const r = buildRequest(inputs.find((i) => i.job === job)!);
  // The crate's own loop descriptions are instrument data, not taste data: check the rest.
  return JSON.stringify({ system: r.system, messages: r.messages }).replace(/The crate \(every loop[\s\S]*?(\\n\\n|"\})/, "");
};

describe("prompts", () => {
  it("every request is text only: no audio, image or document blocks, no base64 blobs", () => {
    for (const input of inputs) {
      const r = buildRequest(input);
      for (const m of r.messages) {
        const blocks = typeof m.content === "string" ? [{ type: "text" }] : m.content;
        for (const b of blocks) expect(b.type, input.job).toBe("text");
      }
      const all = JSON.stringify(r);
      expect(all).not.toMatch(/data:audio|base64|[A-Za-z0-9+/]{200,}/);
      expect(all).not.toMatch(/"type":"(image|document|audio)"/);
    }
  });
  it("no prompt carries the Appendix A families or Appendix B playlists", () => {
    const texts = [SYSTEM_PROMPT, ...Object.values(JOBS_SPEC).map((s) => s.instruction), ...JOBS.map(promptText)];
    for (const t of texts) {
      for (const name of [...APPENDIX_A, ...APPENDIX_B]) expect(t.toLowerCase(), name).not.toContain(name.toLowerCase());
    }
  });
  it("the system prompt carries the honesty rule and the source labels", () => {
    expect(SYSTEM_PROMPT).toMatch(/never receive audio/);
    for (const s of SOURCES) expect(SYSTEM_PROMPT).toContain(`- ${s}:`);
  });
  it("cache layout: the same tools and system prefix for every job; only the profile block differs by profile", () => {
    const a = buildRequest(inputs[0]), b = buildRequest({ ...inputs[5], profile: "Different." });
    expect(JSON.stringify(a.tools)).toBe(JSON.stringify(b.tools));
    expect(a.system[0]).toEqual(b.system[0]);
    expect(a.system[1]).not.toEqual(b.system[1]);
    expect(buildRequest({ ...inputs[0], profile: "" }).system[1].text).toMatch(/empty/);
  });
});
