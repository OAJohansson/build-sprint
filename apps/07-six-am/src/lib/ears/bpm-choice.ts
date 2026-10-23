// Which BPM to show and use, from one stored analysis. The engine's numbers are never changed
// here: this only decides how the reading and its alternative are worded, and which reading the
// Studio gets. Every surface (row, strip, Copy for Claude, export, Set Studio) goes through it.
import type { TempoRelation } from "./bpm";

/** Dance tempi live here; when half/double time is unclear the Studio gets the reading inside it. */
export const STUDIO_PICK_MIN = 90;
export const STUDIO_PICK_MAX = 160;

export type BpmInput = {
  bpm: number;
  bpmAlternative: { bpm: number; relation: TempoRelation } | null;
  bpmAmbiguous: boolean;
};

export type BpmChoice = {
  /** The engine's reading. */
  main: number;
  /** The alternative reading, if the engine gave one (ambiguous or not). */
  alt: number | null;
  relation: TempoRelation | null;
  /** The alternative is about as likely as the main reading. */
  unclear: boolean;
  /** The reading Set Studio uses by default. */
  studio: number;
  /** The other reading, offered as a second Set Studio option (only when unclear). */
  studioOther: number | null;
  /** "72.5 or 145.0" when there is an alternative, else "72.5". */
  text: string;
  /** "half/double time" or "a 3:2 feel": what the two readings differ by. */
  relationWords: string | null;
};

const one = (b: number) => (b > 0 && Number.isFinite(b) ? b.toFixed(1) : "–");
const inPick = (b: number) => b >= STUDIO_PICK_MIN && b <= STUDIO_PICK_MAX;

export function relationPairWords(relation: TempoRelation): string {
  return relation === "2:1" || relation === "1:2" ? "half/double time" : "a 3:2 feel";
}

export function bpmChoice(a: BpmInput): BpmChoice {
  const main = a.bpm;
  const alt = a.bpmAlternative && a.bpmAlternative.bpm > 0 ? a.bpmAlternative.bpm : null;
  const relation = alt != null ? a.bpmAlternative!.relation : null;
  const unclear = alt != null && a.bpmAmbiguous;
  // Unclear: prefer the reading in 90–160; if both or neither are, keep the engine's main.
  const studio = unclear && !inPick(main) && inPick(alt!) ? alt! : main;
  const studioOther = unclear ? (studio === main ? alt : main) : null;
  return {
    main, alt, relation, unclear, studio, studioOther,
    text: alt != null ? `${one(main)} or ${one(alt)}` : one(main),
    relationWords: relation ? relationPairWords(relation) : null,
  };
}

/** The BPM line for Copy for Claude and the export: never only one number when it's unclear. */
export function bpmSentence(a: BpmInput): string {
  const c = bpmChoice(a);
  if (c.alt == null) return one(c.main);
  if (c.unclear) return `${c.text} (${c.relationWords} unclear)`;
  return `${one(c.main)} (${one(c.alt)} less likely)`;
}
