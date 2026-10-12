// Demo data for Sam, shared by the prototypes. "Today" is fixed so the story is always the same:
// Monday 12 Oct 2026, 19:40, nine days before the next appointment with Dr Patel.

export const doctor = "Dr Patel";
export const TODAY = "2026-10-12";
export const NOW = "19:40";
export const appointments = ["2026-07-27", "2026-08-24", "2026-09-21"];
export const nextAppointment = "2026-10-21";

// ---- Dates (UTC throughout, so time zones never shift a day) ----

const DAY = 86_400_000;
export const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
export const addDays = (d: string, n: number) => new Date(toMs(d) + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);
export const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(toMs(d)).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts }).replace("Sept", "Sep");
export const short = (d: string) => fmt(d, { day: "numeric", month: "short" });
export const long = (d: string) => fmt(d, { weekday: "short", day: "numeric", month: "short" });

export const lastAppointment = appointments[appointments.length - 1];
export const daysToGo = daysBetween(TODAY, nextAppointment);

// ---- Medicines ----

export type Form = "Oil" | "Flower" | "Vape" | "Capsule" | "Other";
export type Medicine = {
  id: string;
  name: string;
  form: Form;
  strength: string;
  amount: number;
  when: string[];
};
export const units: Record<Form, { unit: string; step: number; start: number }> = {
  Oil: { unit: "ml", step: 0.1, start: 0.5 },
  Flower: { unit: "g", step: 0.05, start: 0.1 },
  Vape: { unit: "puffs", step: 1, start: 2 },
  Capsule: { unit: "capsules", step: 1, start: 1 },
  Other: { unit: "doses", step: 1, start: 1 },
};
export const amountLabel = (m: Pick<Medicine, "form" | "amount">, amount = m.amount) =>
  `${+amount.toFixed(2)} ${units[m.form].unit}`;

export const demoMedicines: Medicine[] = [
  { id: "oil", name: "Balanced oil", form: "Oil", strength: "THC 20 : CBD 20", amount: 0.5, when: ["Morning", "Bedtime"] },
  { id: "flower", name: "Flower T22", form: "Flower", strength: "THC 22%", amount: 0.1, when: ["When needed"] },
];
export const timesOfDay = ["Morning", "Afternoon", "Evening", "Bedtime", "When needed"];

// ---- Symptoms: plain-word grades (Vinehealth's pattern), each word with what it means ----

export type Symptom = { id: string; name: string; question: string; grades: [string, string][] };
export const symptomCatalogue: Symptom[] = [
  { id: "pain", name: "Pain", question: "How was your pain today?", grades: [["None", "No pain today"], ["Mild", "There, but not in the way"], ["Moderate", "Got in the way of some things"], ["Severe", "Stopped me doing basic things"]] },
  { id: "sleep", name: "Sleep", question: "How did you sleep last night?", grades: [["Well", "Woke up rested"], ["A bit broken", "Woke once or twice"], ["Poorly", "Woke a lot, tired today"], ["Barely", "Hardly slept"]] },
  { id: "fatigue", name: "Tiredness", question: "How tired were you today?", grades: [["Normal", "My usual energy"], ["Mild", "More tired than usual, rest helps"], ["Moderate", "Rest didn't help, some things were hard"], ["Severe", "Hard to get washed or dressed"]] },
  { id: "mood", name: "Mood", question: "How was your mood?", grades: [["Good", "Felt like myself"], ["A bit low", "Low, but managing"], ["Low", "Hard to enjoy things"], ["Very low", "Struggled to get through the day"]] },
  { id: "anxiety", name: "Anxiety", question: "How anxious did you feel?", grades: [["Calm", "Not anxious"], ["A little", "Some worry, no impact"], ["Quite", "Got in the way of some things"], ["Very", "Couldn't do things because of it"]] },
  { id: "stiffness", name: "Stiffness", question: "How stiff were you today?", grades: [["None", "Moving freely"], ["Mild", "Stiff, eased off"], ["Moderate", "Stiff most of the day"], ["Severe", "Hard to move"]] },
  { id: "headache", name: "Headache", question: "Any headache today?", grades: [["None", "No headache"], ["Mild", "There, but not in the way"], ["Moderate", "Got in the way of some things"], ["Severe", "Had to stop and lie down"]] },
  { id: "nausea", name: "Nausea", question: "Any nausea today?", grades: [["None", "None"], ["Mild", "Queasy now and then"], ["Moderate", "Put me off food"], ["Severe", "Couldn't keep food down"]] },
];
export const demoTracked = ["pain", "sleep", "fatigue", "mood"];
export const symptomById = (id: string) => symptomCatalogue.find((s) => s.id === id)!;

export const reliefOptions = ["No help", "A little", "Quite a bit", "A lot"];
export const reliefPhrase = ["Didn't help", "Helped a little", "Helped quite a bit", "Helped a lot"];
export const sideEffects = ["Dry mouth", "Drowsy", "Dizzy", "Foggy", "Anxious", "Hungry"];

// ---- History: one record per day, generated from a fixed seed so it's the same every load ----

export type Dose = { time: string; med: string; amount: number; relief?: number };
export type Day = { date: string; logged: boolean; grades: Record<string, number>; doses: Dose[]; side: string[]; note?: string };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const notes: Record<string, string> = {
  "2026-08-03": "Flare after the long walk on Saturday",
  "2026-08-19": "Started taking the evening dose an hour earlier",
  "2026-09-06": "Good weekend, managed the garden",
  "2026-09-29": "Rough night, neighbours' party",
  "2026-10-08": "Dry mouth again, drinking more water",
};
const missed = new Set(["2026-07-31", "2026-08-09", "2026-08-10", "2026-08-28", "2026-09-14", "2026-09-25", "2026-10-02", "2026-10-03"]);

export const history: Day[] = (() => {
  const r = rng(42);
  const start = appointments[0];
  const span = daysBetween(start, TODAY);
  const out: Day[] = [];
  for (let i = 0; i < span; i++) {
    const date = addDays(start, i);
    const p = i / span; // 0 → 1 across the three months: things ease a little
    const grade = (base: number) => Math.max(0, Math.min(3, Math.round(base + (r() - 0.5) * 1.6)));
    const grades = { pain: grade(2.4 - 0.8 * p), sleep: grade(2.2 - 1.0 * p), fatigue: grade(2.0 - 0.2 * p), mood: grade(1.4 - 0.2 * p) };
    const relief = () => Math.max(0, Math.min(3, Math.round(1.3 + 0.9 * p + (r() - 0.5) * 1.8)));
    const doses: Dose[] = [
      { time: "08:30", med: "oil", amount: 0.5, relief: relief() },
      { time: "21:30", med: "oil", amount: 0.5, relief: relief() },
    ];
    if (grades.pain === 3) doses.splice(1, 0, { time: "15:10", med: "flower", amount: 0.1, relief: relief() });
    const side = [r() < 0.5 ? "Dry mouth" : "", r() < 0.2 ? "Drowsy" : "", r() < 0.06 ? "Dizzy" : ""].filter(Boolean);
    const logged = !missed.has(date);
    out.push(logged ? { date, logged, grades, doses, side, note: notes[date] } : { date, logged, grades: {}, doses: [], side: [] });
  }
  // Last night's dose hasn't been rated yet: Mallow asks on the next open.
  delete out[out.length - 1].doses[out[out.length - 1].doses.length - 1].relief;
  return out;
})();

// ---- Summaries ----

export function periodStats(days: Day[], tracked: string[]) {
  const logged = days.filter((d) => d.logged);
  const avg = (id: string) => {
    const v = logged.map((d) => d.grades[id]).filter((g) => g !== undefined);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
  };
  const doses = logged.flatMap((d) => d.doses);
  const rated = doses.filter((d) => d.relief !== undefined);
  const sideCounts: Record<string, number> = {};
  for (const d of logged) for (const s of d.side) sideCounts[s] = (sideCounts[s] ?? 0) + 1;
  return {
    days: days.length,
    logged: logged.length,
    averages: Object.fromEntries(tracked.map((id) => [id, avg(id)])) as Record<string, number | undefined>,
    doses: doses.length,
    rated: rated.length,
    helped: rated.filter((d) => (d.relief ?? 0) >= 2).length,
    side: Object.entries(sideCounts).sort((a, b) => b[1] - a[1]),
    notes: logged.filter((d) => d.note).map((d) => ({ date: d.date, note: d.note! })),
  };
}

// Words for an average grade, and for a change between two periods (lower = better for all).
export const gradeWord = (s: Symptom, avg?: number) => (avg === undefined ? "–" : s.grades[Math.round(avg)][0]);
export function trendWord(before?: number, now?: number) {
  if (before === undefined || now === undefined) return "Not enough yet";
  const d = now - before;
  if (d <= -0.5) return "Better";
  if (d <= -0.2) return "A little better";
  if (d < 0.2) return "About the same";
  if (d < 0.5) return "A little worse";
  return "Worse";
}

export const periods = () => {
  const bounds = [...appointments, TODAY];
  return bounds.slice(0, -1).map((from, i) => ({
    from,
    to: bounds[i + 1],
    current: i === bounds.length - 2,
    days: history.filter((d) => d.date >= from && d.date < bounds[i + 1]),
  }));
};
