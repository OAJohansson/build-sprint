import { addDays, daysBetween, today, type Day, type Dose, type Medicine } from "./data";

// Everything Mallow keeps, on this phone only.
export type Store = {
  version: 2;
  condition: string; // a conditions id, "" when skipped
  baseline: Record<string, number>; // before treatment: a grade per symptom, set once, editable in Care
  reliefPausedOn?: string; // the day "Not now" was tapped on the relief prompt
  meds: Medicine[];
  tracked: string[];
  doctor: string; // optional name, "" when not given
  past: string[]; // appointment dates so far, oldest first
  next: string; // next appointment, "" when not booked
  days: Day[]; // oldest first; only days with something in them
};

export const emptyDay = (date: string): Day => ({ date, logged: false, grades: {}, doses: [], side: [] });
export const dayOf = (s: Store, date: string) => s.days.find((d) => d.date === date) ?? emptyDay(date);
export const withDay = (s: Store, date: string, fn: (d: Day) => Day): Store => {
  const updated = fn(dayOf(s, date));
  const days = s.days.some((d) => d.date === date)
    ? s.days.map((d) => (d.date === date ? updated : d))
    : [...s.days, updated].sort((a, b) => a.date.localeCompare(b.date));
  return { ...s, days };
};

export const lastOf = (s: Store) => s.past[s.past.length - 1] ?? today();
export const doctorName = (s: Store) => s.doctor.trim() || "your doctor";

// After the appointment date, Sam says whether it happened (a new stretch starts) or moved.
// Nothing rolls over on its own: a moved appointment must never empty the summary.
export const appointmentPassed = (s: Store) => s.next !== "" && s.next < today();
export const confirmAppointment = (s: Store, next = ""): Store => ({ ...s, past: [...s.past, s.next], next });
export const moveAppointment = (s: Store, next: string): Store => ({ ...s, next });

// Every calendar day from the first appointment to today, empty where nothing was logged.
export function allDays(s: Store) {
  const start = s.past[0] ?? s.days[0]?.date ?? today();
  const span = Math.max(daysBetween(start, today()), 0);
  return Array.from({ length: span + 1 }, (_, i) => dayOf(s, addDays(start, i)));
}

// Stretches between appointments, oldest first; the last one runs to today.
export function chaptersOf(s: Store) {
  const days = allDays(s);
  const bounds = [...s.past, "9999-12-31"];
  return s.past.map((from, i) => ({
    from,
    to: i === s.past.length - 1 ? today() : bounds[i + 1],
    days: days.filter((d) => d.date >= from && d.date < bounds[i + 1]),
  }));
}

// The dose Mallow asks about when it opens: the latest unrated one taken an hour or more before
// `since` (when this visit started), from today or yesterday.
export function pendingDose(s: Store, since: { date: string; time: string }) {
  const minutes = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const candidates: { date: string; i: number; dose: Dose }[] = [];
  for (const date of [addDays(since.date, -1), since.date]) {
    dayOf(s, date).doses.forEach((dose, i) => {
      const ago = daysBetween(date, since.date) * 1440 + minutes(since.time) - minutes(dose.time);
      if (dose.relief === undefined && ago >= 60) candidates.push({ date, i, dose });
    });
  }
  return candidates.at(-1);
}

// v1 stored medicines without a history and had no condition or baseline. Upgrade on read, so
// old data keeps working; running it on v2 data changes nothing. A medicine's start is the first
// appointment or its first logged dose, whichever came first.
type V1Medicine = Omit<Medicine, "howTo" | "asNeeded" | "startDate" | "changes"> & Partial<Medicine>;
type V1Store = Omit<Store, "version" | "condition" | "baseline" | "meds"> & Partial<Store> & { meds: V1Medicine[] };

export function migrate(raw: V1Store | Store): Store {
  if (raw.version === 2) return raw as Store;
  const firstDose = (id: string) => raw.days.find((d) => d.doses.some((x) => x.med === id))?.date;
  const meds = raw.meds.map((m): Medicine => {
    const start = [raw.past[0], firstDose(m.id)].filter(Boolean).sort()[0] ?? today();
    return {
      ...m,
      howTo: m.howTo ?? "",
      asNeeded: m.asNeeded ?? "",
      startDate: m.startDate ?? start,
      changes: m.changes ?? [{ date: m.startDate ?? start, amount: m.amount }],
    };
  });
  return { ...raw, version: 2, condition: raw.condition ?? "", baseline: raw.baseline ?? {}, meds };
}
