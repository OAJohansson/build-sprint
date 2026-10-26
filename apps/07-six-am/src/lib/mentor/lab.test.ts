import { describe, expect, it } from "vitest";
import type { TrackMap } from "@/lib/map/types";
import { checkAnswer } from "./answer";
import { cardLeft, factsLine, heardText, keyFlats, perBar, unheardLoop, groupNotes, knowsLine, labContextText, labThread, notesFromThread, parseLabAsk, type LabAsk } from "./lab";
import { buildRequest, SYSTEM_PROMPT } from "./prompt";

// The Mentor in the Lab (S2, B6): what the Lab sends, how it reads in the prompt, what comes back
// out of the stored thread, and the "never claims to hear" checks.

const BARS = 64;
const ones = (from: number, to: number) => Array.from({ length: BARS }, (_, i) => (i >= from && i < to ? 0.9 : 0));
const map: TrackMap = {
  version: 1, id: "https://soundcloud.com/someone/a-track", title: "A Track", uploader: "someone", durationSec: 124,
  bpm: 124, tempo: { earsBpm: 124, refined: true, coherence: 0.9 }, key: "A", scale: "minor", beatsPerBar: 4, originSec: 0.2,
  downbeat: { method: "bar-change", confidence: 0.8 }, bars: BARS, energy: ones(0, 64),
  layers: { kind: "estimate", method: "bands", kick: ones(16, 64), bass: ones(16, 48), chords: ones(0, 64), hats: ones(8, 64), vocals: ones(40, 48) },
  sections: [
    { label: "intro", startBar: 0, endBar: 16, startSec: 0.2, endSec: 31 },
    { label: "drop", startBar: 16, endBar: 32, startSec: 31, endSec: 62 },
    { label: "breakdown", startBar: 32, endBar: 40, startSec: 62, endSec: 77 },
    { label: "drop", startBar: 40, endBar: 64, startSec: 77, endSec: 124 },
  ],
  heardSec: 124, coverage: 1, mappedAt: "2026-10-26T00:00:00Z",
};

const ask: LabAsk = {
  part: "bass", hear: { kind: "only", parts: ["bass"] }, bar: 20, playheadBar: 22, loop: { from: 17, to: 33 },
  chords: ["Am", "F", "Am", null, null, null, null, null],
  measure: { from: 17, to: 33, levelDb: -14, lowMidi: 33, highMidi: 36, notesPerBar: 4, lengthSteps: 2, patternBars: 2 },
};

describe("Lab question context", () => {
  it("parses only known fields, clamps bars and keeps the loop's numbers", () => {
    const p = parseLabAsk({ ...ask, bar: 999, extra: "x", hear: { kind: "only", parts: ["bass", "piano"] }, measure: { ...ask.measure, audio: [1, 2, 3] } }, BARS)!;
    expect(p.bar).toBe(BARS);
    expect(p.hear).toEqual({ kind: "only", parts: ["bass"] });
    expect(p.measure).toEqual(ask.measure);
    expect(JSON.stringify(p)).not.toContain("audio");
    expect(parseLabAsk({ ...ask, part: "piano" }, BARS)).toBeNull();
    // No loop: no measurements of the part, whatever the browser sends.
    expect(parseLabAsk({ ...ask, loop: null }, BARS)!.measure).toBeNull();
    // Chords of the wrong length or with odd names are dropped.
    expect(parseLabAsk({ ...ask, chords: ["Am"] }, BARS)!.chords).toEqual([]);
  });
  it("says the bar, section, focus part, what is heard, the map's estimate, chords and the loop's numbers", () => {
    const t = labContextText(ask, map);
    expect(t).toMatch(/bar 20, in Drop 1 \(bars 17–32\)/);
    expect(t).toMatch(/playhead is at bar 22/);
    expect(t).toMatch(/Focus part[^\n]*Bass/);
    expect(t).toMatch(/hearing only Bass/);
    expect(t).toMatch(/at bar 20 likely playing; plays bars 17–48/);
    expect(t).toMatch(/bars 1–8 Am; bars 9–16 F; bars 17–24 Am\. At bar 20: Am/);
    expect(t).toMatch(/notes from A1 to C2/);
    expect(t).toMatch(/4 notes a bar, notes about 1\/8 long, level -14 dB RMS/);
    expect(t).toMatch(/never the audio/);
  });
  it("without a loop it says there are no numbers of the part itself", () => {
    const t = labContextText({ ...ask, loop: null, measure: null, hear: { kind: "all" } }, map);
    expect(t).toMatch(/No loop is held, so there are no measurements of the bass itself/);
    expect(t).toMatch(/hearing everything/);
  });
  it("facts line and the 'knows' line", () => {
    expect(factsLine(ask.measure)).toBe("A1–C2 · notes ≈ 1/8 · 4 a bar · −14 dB");
    expect(factsLine({ from: 1, to: 9, levelDb: -20 })).toBe("−20 dB");
    // G minor writes flats: A#1 is Bb1.
    expect(factsLine({ from: 41, to: 49, levelDb: -16, lowMidi: 26, highMidi: 34, notesPerBar: 4.5, lengthSteps: 0.9 }, keyFlats("G", "minor"))).toBe("D1–Bb1 · notes ≈ 1/16 · 4–5 a bar · −16 dB");
    expect(factsLine(null)).toBe("");
    expect(knowsLine("bass", ask.hear, "Drop 1", 97)).toBe("The Mentor knows: Bass alone, Drop 1, bar 97; pitch, timing and loudness. Not tone.");
    expect(knowsLine("bass", { kind: "all" }, null, 3)).toBe("The Mentor knows: Bass, bar 3; pitch, timing and loudness. Not tone.");
  });
  it("the prompt carries the Lab facts as text only, with the rule about hearing", () => {
    const r = buildRequest({ job: "lab", profile: "", message: "What's this bass doing?", lab: labContextText(ask, map), history: [{ role: "user", content: "(bar 4, Bass) q" }, { role: "assistant", content: "a" }] });
    const all = JSON.stringify(r);
    expect(all).toMatch(/Lab facts/);
    expect(all).toMatch(/never say or imply you heard the part/);
    expect(r.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(all).not.toMatch(/No track is selected/);
    expect(SYSTEM_PROMPT).toMatch(/The Lab \(job "lab"\)[\s\S]*can't hear the part, its tone/);
  });
});

describe("what the Lab heard (LS2-M3)", () => {
  const heard = { part: { from: 12, levels: [-60, -22, -20, -21, null, null], refDb: -20 } };
  it("parses the heard window and says it before the map's estimate, preferring it for a heard bar", () => {
    const p = parseLabAsk({ ...ask, bar: 14, heard: { ...heard, kick: { from: 12, levels: ["x"] } } }, BARS)!;
    expect(p.heard).toEqual(heard);
    const t = labContextText(p, map);
    expect(t).toMatch(/What the Lab heard of the bass itself[^\n]*at bar 14 playing; bar 12 quiet, bars 13–15 playing, bars 16–17 not heard yet/);
    expect(t).toMatch(/bar 14 has been heard, so prefer what the Lab heard/);
    expect(t.indexOf("What the Lab heard")).toBeLessThan(t.indexOf("The map's estimate"));
  });
  it("a bar not heard yet says so and keeps the estimate", () => {
    expect(heardText(heard.part, 17)).toMatch(/^at bar 17 not heard yet/);
    const t = labContextText({ ...ask, bar: 30, heard }, map);
    expect(t).toMatch(/use it only where the Lab hasn't heard the part yet/);
  });
});

describe("a bar not heard yet (LS2-M6)", () => {
  const unheard = { ...ask, bar: 50, loop: null, measure: null, heard: { part: { from: 34, levels: Array.from({ length: 17 }, () => -20).concat([null]), refDb: -20 } } };
  it("asks for the map's estimate and the loop to hear it; a heard or measured bar doesn't", () => {
    expect(unheardLoop({ ...unheard, bar: 51 }, map)).toBe("bars 41–56");
    expect(labContextText({ ...unheard, bar: 51 }, map)).toMatch(/Answer in two sentences only[^\n]*"Loop bars 41–56 to hear it and get its notes\." No chords/);
    expect(unheardLoop(unheard, map)).toBeNull(); // bar 50 was heard
    expect(unheardLoop({ ...ask }, map)).toBeNull(); // a loop measures it
  });
  it("the answer check holds it to two sentences with the loop line and no chords", () => {
    const answer = (...texts: string[]) => ({ sentences: texts.map((text) => ({ text, source: "ears" })), tellMore: false });
    const needs = { labUnheard: "bars 41–56" };
    expect(checkAnswer("lab", answer("The map estimates the bass plays here.", "Loop bars 41–56 to hear it and get its notes."), needs).ok).toBe(true);
    expect(checkAnswer("lab", answer("The map estimates the bass plays here.", "The chord is Gm.", "Loop bars 41–56 to hear it and get its notes."), needs).ok).toBe(false);
    expect(checkAnswer("lab", answer("The map estimates the bass plays here over a Gm chord.", "Loop bars 41–56 to hear it and get its notes."), needs).ok).toBe(false);
    expect(checkAnswer("lab", answer("The map estimates the bass plays here."), needs).ok).toBe(false);
  });
  it("notes a bar as people say it (LS2-M7)", () => {
    expect([perBar(4), perBar(4.5), perBar(4.1), perBar(5.9)]).toEqual(["4", "4–5", "4", "6"]);
  });
});

describe("Lab notes", () => {
  const rows = [
    { id: "1", role: "user" as const, text: "What's this bass doing?", createdAt: "2026-10-26T10:00:00Z" },
    { id: "2", role: "assistant" as const, answer: { sentences: [{ text: "Short A1 notes.", source: "ears" }], tellMore: false, lab: { bar: 20, part: "bass", facts: "A1 · 55 Hz" } }, createdAt: "2026-10-26T10:00:05Z", costUsd: 0.01 },
    { id: "3", role: "user" as const, text: "lost question", createdAt: "2026-10-26T10:01:00Z" },
    { id: "4", role: "user" as const, text: "And here?", createdAt: "2026-10-26T10:02:00Z" },
    { id: "5", role: "assistant" as const, answer: { sentences: [{ text: "Same.", source: "ears" }], tellMore: false, lab: { bar: 21, part: "bass", facts: "" } }, createdAt: "2026-10-26T10:02:05Z" },
    { id: "6", role: "assistant" as const, answer: { sentences: [{ text: "No meta.", source: "ears" }], tellMore: false }, createdAt: "2026-10-26T10:03:00Z" },
  ];
  it("pairs each question with its answer and its pin; skips lost questions and answers without a pin", () => {
    const n = notesFromThread(rows);
    expect(n.map((x) => [x.q, x.bar, x.part])).toEqual([["What's this bass doing?", 20, "bass"], ["And here?", 21, "bass"]]);
    expect(n[0].answer).toEqual({ sentences: [{ text: "Short A1 notes.", source: "ears" }], tellMore: false });
    expect(n[0].facts).toBe("A1 · 55 Hz");
    expect(notesFromThread([])).toEqual([]);
  });
  it("questions within 3% of the track share one dot", () => {
    const at = (bar: number, t: string) => ({ bar, createdAt: `2026-10-26T10:0${t}:00Z` });
    // 3% of 300 bars = 9 bars, counted from the dot's first question.
    const g = groupNotes([at(97, "2"), at(10, "1"), at(105, "3"), at(104, "4"), at(106, "6"), at(200, "5")], 300);
    expect(g.map((x) => [x.bar, x.notes.length])).toEqual([[10, 1], [97, 3], [106, 1], [200, 1]]);
    expect(groupNotes([], 300)).toEqual([]);
  });
  it("the card hangs right of the dot unless it crosses the playhead or runs out of room", () => {
    expect(cardLeft(100, 50, 1240)).toBe(100);
    expect(cardLeft(100, 300, 1240)).toBe(0); // would cross the playhead: left of the dot (clamped)
    expect(cardLeft(900, 1000, 1240)).toBe(494);
    expect(cardLeft(1000, 200, 1240)).toBe(594);
    expect(cardLeft(100, 50, 1240, 420, true)).toBe(120);
  });
  it("one thread per track, within the column's 600 characters", () => {
    expect(labThread("https://soundcloud.com/a/b")).toBe("lab:https://soundcloud.com/a/b");
    expect(labThread(`https://soundcloud.com/${"x".repeat(700)}`)).toHaveLength(600);
  });
});

describe("Lab answers never claim to hear (B6)", () => {
  const answer = (...texts: string[]) => ({ sentences: texts.map((text) => ({ text, source: "ears" })), tellMore: false });
  it("rejects 'I hear' and 'it sounds'", () => {
    for (const t of ["I hear a short pluck.", "The bass sounds rubbery.", "It sounds warm and round.", "I've listened to the drop."]) {
      expect(checkAnswer("lab", answer(t)).ok, t).toBe(false);
    }
    expect(checkAnswer("lab", answer("I can't hear tone, only pitch, timing and loudness.")).ok).toBe(true);
  });
  it("a question about tone must get 'I can't hear that' said", () => {
    const needs = { labQuestion: "Why is this bass so rubbery?" };
    expect(checkAnswer("lab", answer("Short A1 notes with gaps between the kicks."), needs).ok).toBe(false);
    expect(checkAnswer("lab", answer("I can't hear the sound itself; I read measurements: pitch, timing and loudness.", "The notes are short A1s between the kicks."), needs).ok).toBe(true);
    expect(checkAnswer("lab", answer("Short A1 notes between the kicks."), { labQuestion: "What notes does it play?" }).ok).toBe(true);
  });
  it("plain words: an interval name only with a short explanation (LS2-M5)", () => {
    expect(checkAnswer("lab", answer("It jumps up a minor third on the last note.")).ok).toBe(false);
    expect(checkAnswer("lab", answer("It jumps up a minor third (three notes up) on the last note.")).ok).toBe(true);
  });
  it("keeps to 3 sentences and no hertz", () => {
    expect(checkAnswer("lab", answer("a.", "b.", "c.", "d.")).ok).toBe(false);
    expect(checkAnswer("lab", answer("It sits at 55 Hz.")).ok).toBe(false);
  });
});
