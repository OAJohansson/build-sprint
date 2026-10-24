import { describe, expect, it } from "vitest";
import { bpmChoice, bpmSentence } from "./bpm-choice";

const steady = { bpm: 122, bpmAlternative: null, bpmAmbiguous: false };
const half = { bpm: 72.5, bpmAlternative: { bpm: 145, relation: "2:1" as const }, bpmAmbiguous: true };

describe("bpmChoice", () => {
  it("one reading: shows it and the Studio uses it", () => {
    const c = bpmChoice(steady);
    expect(c.text).toBe("122.0");
    expect(c.studio).toBe(122);
    expect(c.studioOther).toBeNull();
    expect(bpmSentence(steady)).toBe("122.0");
  });

  it("half/double unclear: Studio gets the reading in 90–160, every surface leads with it", () => {
    const c = bpmChoice(half);
    expect(c.studio).toBe(145);
    expect(c.studioOther).toBe(72.5);
    expect(c.lead).toBe(145);
    expect(c.other).toBe(72.5);
    expect(c.otherRelation).toBe("1:2");
    expect(c.text).toBe("145.0 or 72.5");
    expect(bpmSentence(half)).toBe("145.0 or 72.5 (half/double time unclear)");
    // The engine's numbers are untouched.
    expect(c.main).toBe(72.5);
    expect(c.alt).toBe(145);
  });

  it("main already in 90–160: keeps the main reading for the Studio", () => {
    const c = bpmChoice({ bpm: 128, bpmAlternative: { bpm: 64, relation: "1:2" }, bpmAmbiguous: true });
    expect(c.studio).toBe(128);
    expect(c.studioOther).toBe(64);
    expect(c.lead).toBe(128);
    expect(c.otherRelation).toBe("1:2");
    expect(c.text).toBe("128.0 or 64.0");
  });

  it("both readings in range (3:2): keeps the main one and words the relation", () => {
    const a = { bpm: 100, bpmAlternative: { bpm: 150, relation: "3:2" as const }, bpmAmbiguous: true };
    expect(bpmChoice(a).studio).toBe(100);
    expect(bpmSentence(a)).toBe("100.0 or 150.0 (a 3:2 feel unclear)");
  });

  it("neither reading in range: keeps the main one", () => {
    expect(bpmChoice({ bpm: 87, bpmAlternative: { bpm: 174, relation: "2:1" }, bpmAmbiguous: true }).studio).toBe(87);
  });

  it("alternative not ambiguous: Studio uses main, no second option, text says less likely", () => {
    const a = { bpm: 126, bpmAlternative: { bpm: 63, relation: "1:2" as const }, bpmAmbiguous: false };
    const c = bpmChoice(a);
    expect(c.studio).toBe(126);
    expect(c.lead).toBe(126);
    expect(c.studioOther).toBeNull();
    expect(bpmSentence(a)).toBe("126.0 (63.0 less likely)");
  });

  it("edges: boundary 90 and 160 count as inside, a zero BPM shows a dash", () => {
    expect(bpmChoice({ bpm: 180, bpmAlternative: { bpm: 90, relation: "1:2" }, bpmAmbiguous: true }).studio).toBe(90);
    expect(bpmChoice({ bpm: 80, bpmAlternative: { bpm: 160, relation: "2:1" }, bpmAmbiguous: true }).studio).toBe(160);
    const up = bpmChoice({ bpm: 180, bpmAlternative: { bpm: 90, relation: "1:2" }, bpmAmbiguous: true });
    expect([up.lead, up.other, up.otherRelation]).toEqual([90, 180, "2:1"]);
    expect(bpmChoice({ bpm: 0, bpmAlternative: null, bpmAmbiguous: false }).text).toBe("–");
  });
});
