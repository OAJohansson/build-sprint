import { addDays, scheduledTimes, type Dose, type Medicine } from "./data";
import { activeOn, amountOn } from "./history";
import { dayOf, type Store } from "./store";

// What's due now. A plan day runs from 04:00 to 04:00, so a bedtime dose ticked at 00:30 still
// counts toward last night (owner, 20 Oct); the dose itself keeps its real date and time.

export const DAY_STARTS = "04:00";
// Each time of day as minutes into the plan day's clock; Bedtime runs past midnight.
const windows: Record<string, [number, number]> = {
  Morning: [4 * 60, 12 * 60],
  Afternoon: [12 * 60, 17 * 60],
  Evening: [17 * 60, 21 * 60],
  Bedtime: [21 * 60, 28 * 60],
};

const minutes = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
// Minutes since the plan day started, counting past midnight (00:30 → 24:30).
const planMinutes = (t: string) => (t < DAY_STARTS ? minutes(t) + 24 * 60 : minutes(t));

export const planDate = (now: { date: string; time: string }) => (now.time < DAY_STARTS ? addDays(now.date, -1) : now.date);

// Every dose that belongs to a plan day: that date from 04:00, and the next date before 04:00.
export function planDoses(s: Store, date: string) {
  const same = dayOf(s, date).doses.map((dose, index) => ({ dose, date, index })).filter((x) => x.dose.time >= DAY_STARTS);
  const next = addDays(date, 1);
  const after = dayOf(s, next).doses.map((dose, index) => ({ dose, date: next, index })).filter((x) => x.dose.time < DAY_STARTS);
  return [...same, ...after];
}

export type Status = "taken" | "now" | "later" | "not taken";
export type Due = {
  med: Medicine;
  slot: string;
  amount: number;
  status: Status;
  taken?: { dose: Dose; date: string; index: number };
};

// The plan for the plan day containing `now`, in time-of-day order. A slot nobody ticked shows
// as "not taken" once its window has passed, never as a failure.
export function duePlan(s: Store, now: { date: string; time: string }): Due[] {
  const date = planDate(now);
  const at = planMinutes(now.time);
  const doses = planDoses(s, date);
  const out: Due[] = [];
  for (const slot of scheduledTimes) {
    for (const med of s.meds) {
      if (!activeOn(med, date) || !med.when.includes(slot)) continue;
      const taken = doses.find((x) => x.dose.med === med.id && x.dose.slot === slot);
      const [from, to] = windows[slot];
      const status: Status = taken ? "taken" : at < from ? "later" : at < to ? "now" : "not taken";
      out.push({ med, slot, amount: amountOn(med, date), status, taken });
    }
  }
  return out;
}

// Where a ticked dose is written: the real calendar day and time it was taken.
export const tickDose = (due: Due, now: { date: string; time: string }): { date: string; dose: Dose } => ({
  date: now.date,
  dose: { time: now.time, med: due.med.id, amount: due.amount, slot: due.slot },
});
