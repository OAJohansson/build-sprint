import {
  TODAY,
  appointments,
  daysBetween,
  demoMedicines,
  demoTracked,
  history,
  nextAppointment,
  type Day,
  type Medicine,
} from "./data";

// Everything the prototype app knows. The real app keeps this in localStorage.
export type Store = {
  meds: Medicine[];
  tracked: string[];
  past: string[]; // appointment dates so far, oldest first
  next: string; // next appointment, or "" when not booked
  days: Day[]; // before today, oldest first
  today: Day;
};

export const demoStore = (): Store => ({
  meds: demoMedicines,
  tracked: demoTracked,
  past: appointments,
  next: nextAppointment,
  days: history,
  today: {
    date: TODAY,
    logged: false,
    grades: {},
    doses: [{ time: "08:30", med: "oil", amount: 0.5, relief: 1 }],
    side: [],
  },
});

export const emptyToday = (): Day => ({ date: TODAY, logged: false, grades: {}, doses: [], side: [] });

export const lastOf = (s: Store) => s.past[s.past.length - 1] ?? TODAY;

// Periods between appointments ("chapters"), oldest first; the last one runs to today.
export function chaptersOf(s: Store) {
  const all = [...s.days, ...(s.today.logged || s.today.doses.length ? [s.today] : [])];
  const bounds = [...s.past, "9999-12-31"];
  return s.past.map((from, i) => ({
    n: i + 1,
    from,
    to: i === s.past.length - 1 ? TODAY : bounds[i + 1],
    current: i === s.past.length - 1,
    days: all.filter((d) => d.date >= from && d.date < bounds[i + 1]),
  }));
}

// The dose Mallow asks about on opening: the latest one from before today without a rating.
export function pendingDose(s: Store) {
  const yesterday = s.days[s.days.length - 1];
  if (!yesterday || daysBetween(yesterday.date, TODAY) !== 1) return undefined;
  const i = yesterday.doses.findLastIndex((d) => d.relief === undefined);
  return i === -1 ? undefined : { day: yesterday.date, i, dose: yesterday.doses[i] };
}
