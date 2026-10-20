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

// The caption above the graph: then → now, in the Summary's words (owner, 20 Oct).
// "Anxiety before treatment: quite. Last 4 weeks: a little to quite · a little better."
// "Then" is before treatment, or the first 4 weeks when there's no starting point. "Now" is the
// stretch since the last appointment, the Summary's own window, so the two never disagree
// ("Now (since your last appointment, 22 Sep)"); with no appointment since starting, the last 4 weeks. It says what changed, never why, and gives no date for when it shifted: a date
// beside a medicine's start would invite "that's what did it". Never "working" or "because of".
export function plainLine(s: Store, id: string, end = today()) {
  const sym = symptomById(id);
  const start = treatmentStart(s.meds);
  if (!start) return undefined;
  const word = (g: number) => gradeWord(sym, g).toLowerCase();
  // An average needs at least 3 check-ins: no verdict from one or two days.
  const meanOf = (from: string, to: string) => {
    const pts = series(s, id, from, to);
    return pts.filter((p) => p.grade !== undefined).length >= MIN_IN_WINDOW ? mean(pts) : undefined;
  };
  const first = s.meds.filter((m) => m.startDate === start);
  const since = `Since starting ${first.length === 1 ? first[0].name : "treatment"} (${short(start)})`;
  const visit = s.past[s.past.length - 1];
  const fromVisit = visit && visit > start && visit < end ? meanOf(visit, end) : undefined;
  const recentFrom = addDays(end, -27) > start ? addDays(end, -27) : start;
  const recent = recentFrom > start ? meanOf(recentFrom, end) : undefined;
  const now = fromVisit ?? recent ?? meanOf(start, end);
  if (now === undefined) return undefined;
  const nowLabel = fromVisit !== undefined ? `Now (since your last appointment, ${short(visit)})` : recent !== undefined ? "Last 4 weeks" : since;

  const base = s.baseline[id];
  // Without a starting point, the first 4 weeks stand in, once there are 4 more weeks after them.
  const early = daysBetween(start, end) >= 55 ? meanOf(start, addDays(start, 27)) : undefined;
  const then =
    base !== undefined
      ? { label: "before treatment", word: sym.grades[base][0].toLowerCase(), value: base }
      : early !== undefined
        ? { label: "in the first 4 weeks", word: word(early), value: early }
        : undefined;
  if (!then) return `${since}: ${sym.name.toLowerCase()} mostly ${word(now)}.`;
  return `${sym.name} ${then.label}: ${then.word}. ${nowLabel}: ${word(now)} · ${trendWord(then.value, now).toLowerCase()}.`;
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
