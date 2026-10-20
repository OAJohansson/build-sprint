import { addDays, today, type Day, type Dose } from "./data";
import { newMedicine, updateMedicine } from "./history";
import type { Store } from "./store";

// Two demo patients whose histories tell the v2 story, relative to today, the same every time
// (fixed seeds). Kept apart from real entries (see use-mallow).
// - Sam: fibromyalgia, about 4 months on a balanced oil (plus flower on flare days); the oil was
//   increased at the third appointment, and pain eases a little after it.
// - Priya: anxiety and poor sleep, about 3 months on an oil at night; a vape was added halfway for
//   anxious moments, so the medicine strip shows the overlap.
// Both have missed days, a run of days away, a few bad days and a before-treatment baseline.

export type Persona = "sam" | "priya";
export const personas: { id: Persona; name: string; sub: string }[] = [
  { id: "sam", name: "Sam", sub: "Fibromyalgia, 4 months" },
  { id: "priya", name: "Priya", sub: "Anxiety and sleep, 3 months" },
];

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (g: number) => Math.max(0, Math.min(3, Math.round(g)));
const lerp = (a: number, b: number, p: number) => a + (b - a) * Math.min(Math.max(p, 0), 1);

export function demoStore(who: Persona = "sam", end = today()): Store {
  return who === "sam" ? sam(end) : priya(end);
}

function sam(end: string): Store {
  const span = 118;
  const first = addDays(end, -span);
  const raise = 56; // third appointment: oil from 0.5 to 0.7 ml
  const past = [0, 28, 56, 84, 112].map((d) => addDays(first, d));
  let oil = newMedicine({ name: "Balanced oil", form: "Oil", strength: "THC 20 : CBD 20", amount: 0.5, when: ["Morning", "Bedtime"], howTo: "Under the tongue, hold for a minute", asNeeded: "" }, first, "oil");
  oil = updateMedicine(oil, { ...oil, amount: 0.7 }, addDays(first, raise));
  const flower = newMedicine({ name: "Flower T22", form: "Flower", strength: "THC 22%", amount: 0.1, when: ["When needed"], howTo: "In the vaporiser", asNeeded: "On a flare day, as on the label" }, first, "flower");

  const r = rng(42);
  const away = new Set([38, 39, 40, 41, 42]); // a week at their sister's, nothing logged
  const flares = new Set([9, 33, 47, 71, 98]);
  const notes: Record<number, string> = { 9: "Flare after the long walk on Saturday", 47: "Bad week, cold weather", 61: "First week on the higher dose", 88: "Good weekend, managed the garden", 110: "Dry mouth again, drinking more water" };
  const days: Day[] = [];
  for (let i = 0; i <= span; i++) {
    const date = addDays(first, i);
    const isToday = i === span;
    const amount = i < raise ? 0.5 : 0.7;
    const doses: Dose[] = [{ time: "08:30", med: "oil", amount, slot: "Morning", relief: clamp(1.4 + r() * 1.4) }];
    if (!isToday) doses.push({ time: "21:30", med: "oil", amount, slot: "Bedtime", relief: clamp(1.4 + r() * 1.4) });
    if (isToday) {
      days.push({ date, logged: false, grades: {}, doses, side: [] });
      continue;
    }
    if (away.has(i) || (r() < 0.12 && !flares.has(i))) continue;
    // Pain eases slowly, levels off before the increase, then eases again.
    const pain = i < raise ? lerp(2.5, 1.9, i / raise) : lerp(1.9, 1.3, (i - raise) / (span - raise));
    const n = () => (r() - 0.5) * 1.3;
    const flare = flares.has(i);
    const grades = {
      pain: flare ? 3 : clamp(pain + n()),
      sleep: flare ? 3 : clamp(lerp(2.2, 1.4, i / span) + n()),
      fatigue: clamp(lerp(2.1, 1.7, i / span) + n()),
      mood: clamp(lerp(1.5, 1.1, i / span) + n()),
    };
    if (flare || grades.pain === 3) doses.splice(1, 0, { time: "15:10", med: "flower", amount: 0.1, relief: clamp(1.5 + r() * 1.5) });
    const side = [r() < 0.45 ? "Dry mouth" : "", r() < 0.15 + (i >= raise ? 0.08 : 0) ? "Drowsy" : "", r() < 0.05 ? "Dizzy" : ""].filter(Boolean);
    days.push({ date, logged: true, grades, doses, side, note: notes[i] });
  }
  // Last night's dose hasn't been rated yet: with two medicines in use, Mallow asks once.
  delete days[days.length - 2]?.doses.at(-1)?.relief;
  return {
    version: 2, condition: "pain", baseline: { pain: 3, sleep: 2, fatigue: 2, mood: 1 },
    meds: [oil, flower], tracked: ["pain", "sleep", "fatigue", "mood"], doctor: "Dr Patel", past, next: addDays(end, 22), days,
  };
}

function priya(end: string): Store {
  const span = 90;
  const first = addDays(end, -span);
  const vapeFrom = 46;
  const past = [0, 30, 60].map((d) => addDays(first, d));
  const oil = newMedicine({ name: "Balanced oil", form: "Oil", strength: "THC 10 : CBD 10", amount: 0.3, when: ["Bedtime"], howTo: "Under the tongue, an hour before bed", asNeeded: "" }, first, "oil");
  const vape = newMedicine({ name: "Vape cartridge", form: "Vape", strength: "THC 18 : CBD 2", amount: 2, when: ["When needed"], howTo: "As shown at the clinic", asNeeded: "Up to 3 puffs when anxious" }, addDays(first, vapeFrom), "vape");

  const r = rng(7);
  const away = new Set([21, 22, 23, 24]);
  const bad = new Set([14, 37, 52, 79]);
  const notes: Record<number, string> = { 14: "Work deadline, barely slept", 37: "Panicky on the train", 49: "Tried the vape before the meeting", 79: "Family stuff, rough day" };
  const days: Day[] = [];
  for (let i = 0; i <= span; i++) {
    const date = addDays(first, i);
    const doses: Dose[] = [];
    if (i < span) doses.push({ time: "21:45", med: "oil", amount: 0.3, slot: "Bedtime", relief: clamp(1.3 + r() * 1.6) });
    if (i === span) {
      days.push({ date, logged: false, grades: {}, doses, side: [] });
      continue;
    }
    if (away.has(i) || (r() < 0.14 && !bad.has(i))) {
      if (doses.length) days.push({ date, logged: false, grades: {}, doses, side: [] });
      continue;
    }
    const n = () => (r() - 0.5) * 1.3;
    const isBad = bad.has(i);
    // Sleep settles in the first six weeks; anxiety only eases a little until the vape is added.
    const anxiety = isBad ? 3 : clamp((i < vapeFrom ? lerp(2.3, 1.9, i / vapeFrom) : lerp(1.8, 1.2, (i - vapeFrom) / (span - vapeFrom))) + n());
    const grades = {
      anxiety,
      sleep: isBad ? 3 : clamp(lerp(2.3, 1.2, i / 45) + n()),
      mood: clamp(lerp(1.7, 1.0, i / span) + n() + (isBad ? 1 : 0)),
    };
    if (i >= vapeFrom && anxiety >= 2) doses.unshift({ time: "13:20", med: "vape", amount: anxiety === 3 ? 3 : 2, relief: r() < 0.7 ? clamp(1.2 + r() * 1.8) : undefined });
    const side = [r() < 0.25 ? "Dry mouth" : "", r() < 0.2 ? "Drowsy" : "", i >= vapeFrom && r() < 0.08 ? "Dizzy" : ""].filter(Boolean);
    days.push({ date, logged: true, grades, doses: doses.sort((a, b) => a.time.localeCompare(b.time)), side, note: notes[i] });
  }
  delete days[days.length - 2]?.doses.at(-1)?.relief;
  return {
    version: 2, condition: "anxiety", baseline: { anxiety: 2, sleep: 2, mood: 2 },
    meds: [oil, vape], tracked: ["anxiety", "sleep", "mood"], doctor: "Dr Okafor", past, next: addDays(end, 4), days,
  };
}
