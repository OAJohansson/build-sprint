import { z } from "zod";

// What Claude extracts from a spoken note. Nullable fields: people often say
// "worked up to 70" without sets/reps, and that's fine to log as-is.
export const ParsedSessionSchema = z.object({
  date: z
    .string()
    .nullable()
    .describe("YYYY-MM-DD if the note mentions a date (e.g. 'yesterday'), else null"),
  title: z.string().describe("Short label for the session, e.g. 'Snatch + clean day'"),
  lifts: z.array(
    z.object({
      movement: z.string().describe("Canonical movement name in Title Case, e.g. 'Power Clean'"),
      sets: z.number().nullable(),
      reps: z.number().nullable().describe("Reps per set"),
      weight: z.number().nullable().describe("Load per rep; null for bodyweight"),
      unit: z.enum(["kg", "lb"]),
      note: z.string().nullable().describe("Anything else worth keeping: 'felt easy', 'missed 2nd'"),
    }),
  ),
});

export type ParsedSession = z.infer<typeof ParsedSessionSchema>;
export type Unit = "kg" | "lb";

export type Lift = {
  id: string;
  movement: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  unit: Unit;
  note: string | null;
};

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  transcript: string;
  lifts: Lift[];
  createdAt: number;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function formatLift(l: Pick<Lift, "sets" | "reps" | "weight" | "unit">) {
  const scheme =
    l.sets && l.reps ? `${l.sets}×${l.reps}` : l.reps ? `${l.reps} rep${l.reps > 1 ? "s" : ""}` : "";
  const load = l.weight != null ? `${l.weight} ${l.unit}` : "";
  return [scheme, load].filter(Boolean).join(" @ ") || "—";
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
