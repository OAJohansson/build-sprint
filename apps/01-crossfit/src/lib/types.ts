import { z } from "zod";

export type Unit = "kg" | "lb";

/** One line of a session: a lift (sets × reps @ weight) or a WOD (score). */
export type Entry = {
  id: string;
  movement: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  unit: Unit;
  score: string | null; // WODs and cardio tests: "4:32", "20+5"
  rx: boolean | null;
  note: string | null;
};

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  transcript: string;
  entries: Entry[];
  createdAt: string;
};

export type PbKindStored = "load" | "reps" | "time" | "rounds";

/** A PB record. History is kept; the current PB is the best per movement + kind + rep max. */
export type Pb = {
  id: string;
  movement: string;
  kind: PbKindStored;
  repMax: number | null; // load only: 1 = 1RM, 3 = 3RM…
  value: number; // load: weight in `unit`; reps: count; time: seconds; rounds: rounds*1000 + reps
  unit: Unit | null;
  rx: boolean | null;
  achievedOn: string;
  sessionId: string | null;
};

export type NewPb = { pb: Pb; previous: Pb | null };

// What Claude extracts from a spoken note.
export const ParsedSessionSchema = z.object({
  date: z.string().nullable().describe("YYYY-MM-DD if the note mentions a date (e.g. 'yesterday'), else null"),
  title: z.string().describe("Short label for the session, e.g. 'Olympic day'"),
  entries: z.array(
    z.object({
      movement: z.string().describe("Exact name from the movement list when one matches"),
      sets: z.number().nullable(),
      reps: z.number().nullable().describe("Reps per set"),
      weight: z.number().nullable().describe("Load per rep; null for bodyweight"),
      unit: z.enum(["kg", "lb"]),
      score: z.string().nullable().describe("WOD or cardio result: 'm:ss' for time, 'rounds+reps' for AMRAP"),
      rx: z.boolean().nullable().describe("true if done Rx, false if scaled, null if not said"),
      note: z.string().nullable(),
    }),
  ),
});
export type ParsedSession = z.infer<typeof ParsedSessionSchema>;

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12);

export const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", opts);
}

export function formatEntry(e: Pick<Entry, "sets" | "reps" | "weight" | "unit" | "score" | "rx">) {
  if (e.score) return `${e.score}${e.rx === true ? " Rx" : e.rx === false ? " scaled" : ""}`;
  const scheme = e.sets && e.reps ? `${e.sets} × ${e.reps}` : e.reps ? `${e.reps} rep${e.reps > 1 ? "s" : ""}` : "";
  const load = e.weight != null ? `${e.weight} ${e.unit}` : "";
  return [scheme, load].filter(Boolean).join(" @ ") || "—";
}
