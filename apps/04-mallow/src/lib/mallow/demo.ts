import { addDays, daysBetween, today, type Day, type Medicine } from "./data";
import type { Store } from "./store";

// Sam's demo history: eleven weeks on a balanced oil (plus flower on flare days), three
// appointments, a few missed days, and things easing a little. Dates are relative to today, and
// a fixed seed makes it the same every time. Kept apart from real entries (see use-mallow).

const meds: Medicine[] = [
  { id: "oil", name: "Balanced oil", form: "Oil", strength: "THC 20 : CBD 20", amount: 0.5, when: ["Morning", "Bedtime"] },
  { id: "flower", name: "Flower T22", form: "Flower", strength: "THC 22%", amount: 0.1, when: ["When needed"] },
];

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const missedOffsets = new Set([4, 13, 14, 32, 46, 57, 64, 65]); // days after the first appointment
const notes: Record<number, string> = {
  7: "Flare after the long walk on Saturday",
  23: "Started taking the evening dose an hour earlier",
  41: "Good weekend, managed the garden",
  64: "Rough night, neighbours' party",
  73: "Dry mouth again, drinking more water",
};

export function demoStore(): Store {
  const end = today();
  const first = addDays(end, -77);
  const past = [first, addDays(end, -49), addDays(end, -21)];
  const r = rng(42);
  const span = daysBetween(first, end);
  const days: Day[] = [];
  for (let i = 0; i < span; i++) {
    const date = addDays(first, i);
    const p = i / span;
    const grade = (base: number) => Math.max(0, Math.min(3, Math.round(base + (r() - 0.5) * 1.6)));
    const grades = { pain: grade(2.4 - 0.8 * p), sleep: grade(2.2 - 1.0 * p), fatigue: grade(2.0 - 0.2 * p), mood: grade(1.4 - 0.2 * p) };
    const relief = () => Math.max(0, Math.min(3, Math.round(1.1 + 0.9 * p + (r() - 0.5) * 1.8)));
    const doses = [
      { time: "08:30", med: "oil", amount: 0.5, relief: relief() as number | undefined },
      { time: "21:30", med: "oil", amount: 0.5, relief: relief() as number | undefined },
    ];
    if (grades.pain === 3) doses.splice(1, 0, { time: "15:10", med: "flower", amount: 0.1, relief: relief() });
    const side = [r() < 0.5 ? "Dry mouth" : "", r() < 0.2 ? "Drowsy" : "", r() < 0.06 ? "Dizzy" : ""].filter(Boolean);
    if (missedOffsets.has(i)) continue;
    days.push({ date, logged: true, grades, doses, side, note: notes[i] });
  }
  // Last night's dose hasn't been rated yet, and this morning's dose is in: Mallow asks on opening.
  delete days[days.length - 1].doses.at(-1)!.relief;
  days.push({ date: end, logged: false, grades: {}, doses: [{ time: "08:30", med: "oil", amount: 0.5, relief: 1 }], side: [] });
  return { meds, tracked: ["pain", "sleep", "fatigue", "mood"], doctor: "Dr Patel", past, next: addDays(end, 9), days };
}
