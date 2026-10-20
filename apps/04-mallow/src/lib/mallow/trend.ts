import { addDays, daysBetween, gradeWord, short, symptomById, today, trendWord, type Day, type Medicine } from "./data";
import { activeOn, treatmentStart } from "./history";
import { dayOf, type Store } from "./store";

// The sums behind "is it changing?": a daily series per symptom, a 7-day average that leaves
// gaps as gaps, comparisons with the period before and with before treatment, and one plain
// line. Describes change only; it never says why (the doctor interprets).

export type Range = "4w" | "3m" | "all";
export const rangeLabel: Record<Range, string> = { "4w": "4 weeks", "3m": "3 months", all: "Since starting" };

// First day shown for a range. Fixed day counts (28, 91) so month ends never shift the window.
export function rangeStart(s: Store, range: Range, end = today()) {
  const started = treatmentStart(s.meds) ?? s.days[0]?.date ?? end;
  if (range === "all") return started < end ? started : end;
  return addDays(end, range === "4w" ? -27 : -90);
}

export type Point = { date: string; grade?: number; avg?: number };

// One entry per calendar day from `from` to `to` (inclusive); grade only where checked in.
export function series(s: Store, id: string, from: string, to: string): Point[] {
  const n = Math.max(daysBetween(from, to), 0) + 1;
  const days = Array.from({ length: n }, (_, i) => dayOf(s, addDays(from, i)));
  const grade = (d: Day) => (d.logged ? d.grades[id] : undefined);
  // Days before `from` count toward the first averages, so the line doesn't start late.
  const lookback = Array.from({ length: 6 }, (_, i) => dayOf(s, addDays(from, i - 6))).map(grade);
  const all = [...lookback, ...days.map(grade)];
  return days.map((d, i) => ({ date: d.date, grade: grade(d), avg: average7(all.slice(i, i + 7)) }));
}

// The 7-day average needs at least 3 check-ins in the window; with fewer it's a gap, not a guess.
export const MIN_IN_WINDOW = 3;
export function average7(window: (number | undefined)[]) {
  const v = window.filter((g): g is number => g !== undefined);
  return v.length >= MIN_IN_WINDOW ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
}

export const mean = (pts: Point[]) => {
  const v = pts.map((p) => p.grade).filter((g): g is number => g !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
};

// Change over a range: the range itself, the same number of days before it, and before treatment.
export function compare(s: Store, id: string, from: string, to: string) {
  const len = daysBetween(from, to) + 1;
  const now = mean(series(s, id, from, to));
  const before = mean(series(s, id, addDays(from, -len), addDays(from, -1)));
  const baseline = s.baseline[id];
  return {
    now,
    before,
    baseline,
    vsBefore: trendWord(before, now),
    vsBaseline: trendWord(baseline, now),
  };
}

// "Since starting Balanced oil (3 Sep): sleep mostly a bit broken. Before treatment: poorly."
// Never "working", "effective" or "because of".
export function plainLine(s: Store, id: string, end = today()) {
  const sym = symptomById(id);
  const start = treatmentStart(s.meds);
  if (!start) return undefined;
  const now = mean(series(s, id, start, end));
  if (now === undefined) return undefined;
  const first = s.meds.filter((m) => m.startDate === start);
  const what = first.length === 1 ? first[0].name : "treatment";
  const base = s.baseline[id];
  const before = base !== undefined ? ` Before treatment: ${sym.grades[base][0].toLowerCase()}.` : "";
  return `Since starting ${what} (${short(start)}): ${sym.name.toLowerCase()} mostly ${gradeWord(sym, now).toLowerCase()}.${before}`;
}

// The medicine strip: a bar per medicine taken at any point in the range, clipped to it, with
// the amount changes inside it.
export type Bar = { med: Medicine; from: string; to: string; changes: { date: string; amount: number }[] };
export function medicineBars(meds: Medicine[], from: string, to: string): Bar[] {
  return meds
    .filter((m) => m.startDate <= to && (!m.stopDate || m.stopDate > from))
    .map((m) => ({
      med: m,
      from: m.startDate > from ? m.startDate : from,
      to: m.stopDate && addDays(m.stopDate, -1) < to ? addDays(m.stopDate, -1) : to,
      changes: m.changes.slice(1).filter((c) => c.date >= from && c.date <= to),
    }))
    .sort((a, b) => a.med.startDate.localeCompare(b.med.startDate));
}

// Medicines in use at any point in a period, for the summary.
export const medsDuring = (meds: Medicine[], from: string, to: string) =>
  meds.filter((m) => activeOn(m, to) || (m.startDate <= to && (!m.stopDate || m.stopDate > from)));
