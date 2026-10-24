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
  /** The reading every surface leads with (the big LCD, the row, Copy, export): the Studio pick
   *  when half/double time is unclear, else the engine's main reading. */
  lead: number;
  /** The other reading, shown beside the lead ("or 72.5"). */
  other: number | null;
  /** What the other reading is relative to the lead (the lead is "1:1"). */
  otherRelation: TempoRelation | null;
  /** "145.0 or 72.5" (lead first) when there is an alternative, else "72.5". */
  text: string;
  /** "half/double time" or "a 3:2 feel": what the two readings differ by. */
  relationWords: string | null;
};

const one = (b: number) => (b > 0 && Number.isFinite(b) ? b.toFixed(1) : "–");
const inPick = (b: number) => b >= STUDIO_PICK_MIN && b <= STUDIO_PICK_MAX;
const INVERSE: Record<TempoRelation, TempoRelation> = { "2:1": "1:2", "1:2": "2:1", "3:2": "2:3", "2:3": "3:2" };

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
  // Lead with what the Studio gets (N1, 24 Oct): when that's the alternative, the engine's main
  // reading becomes "the other" and its relation flips (145 lead → 72.5 is half time).
  const flipped = unclear && studio !== main;
  const lead = flipped ? studio : main;
  const other = flipped ? main : alt;
  const otherRelation = relation ? (flipped ? INVERSE[relation] : relation) : null;
  return {
    main, alt, relation, unclear, studio, studioOther, lead, other, otherRelation,
    text: other != null ? `${one(lead)} or ${one(other)}` : one(lead),
    relationWords: relation ? relationPairWords(relation) : null,
  };
}

/** The BPM line for Copy for Claude and the export: never only one number when it's unclear. */
export function bpmSentence(a: BpmInput): string {
  const c = bpmChoice(a);
  if (c.other == null) return one(c.lead);
  if (c.unclear) return `${c.text} (${c.relationWords} unclear)`;
  return `${one(c.lead)} (${one(c.other)} less likely)`;
}
