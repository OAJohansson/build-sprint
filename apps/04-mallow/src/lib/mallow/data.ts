// Mallow's vocabulary: dates, medicines, symptoms and the sums behind the summary.

// ---- Dates: "YYYY-MM-DD" strings for the user's own calendar days; maths in UTC so a day is a day ----

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
export const addDays = (d: string, n: number) => new Date(toMs(d) + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);
export const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(toMs(d)).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts }).replace("Sept", "Sep");
export const short = (d: string) => fmt(d, { day: "numeric", month: "short" });
export const long = (d: string) => fmt(d, { weekday: "short", day: "numeric", month: "short" });

// ---- Medicines ----

export type Form = "Oil" | "Flower" | "Vape" | "Capsule" | "Other";
export type Medicine = {
  id: string;
  name: string; // as on the pharmacy label
  form: Form;
  strength: string;
  amount: number; // the amount prescribed now (the last entry in `changes`)
  when: string[]; // times of day, plus "When needed" for an as-needed medicine
  howTo: string; // "Under the tongue, hold for a minute"; "" when not given
  asNeeded: string; // the as-needed rule from the label, e.g. "Up to 3 puffs when anxious"
  startDate: string;
  stopDate?: string; // first day it was no longer taken
  changes: { date: string; amount: number }[]; // oldest first; the first entry is the starting amount
};
export const units: Record<Form, { unit: string; step: number; start: number }> = {
  Oil: { unit: "ml", step: 0.1, start: 0.5 },
  Flower: { unit: "g", step: 0.05, start: 0.1 },
  Vape: { unit: "puffs", step: 1, start: 2 },
  Capsule: { unit: "capsules", step: 1, start: 1 },
  Other: { unit: "doses", step: 1, start: 1 },
};
export const amountLabel = (m: Pick<Medicine, "form" | "amount">, amount = m.amount) => {
  const n = +amount.toFixed(2);
  const unit = units[m.form].unit;
  return `${n} ${n === 1 && unit.endsWith("s") ? unit.slice(0, -1) : unit}`;
};
export const timesOfDay = ["Morning", "Afternoon", "Evening", "Bedtime", "When needed"];
export const scheduledTimes = ["Morning", "Afternoon", "Evening", "Bedtime"];

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
  { id: "appetite", name: "Appetite", question: "How was your appetite today?", grades: [["Normal", "Ate as usual"], ["A bit low", "Ate a little less than usual"], ["Low", "Hard to eat a proper meal"], ["Very low", "Barely ate"]] },
  { id: "spasm", name: "Muscle spasm", question: "How were your muscle spasms today?", grades: [["None", "No spasms"], ["Mild", "A few, not in the way"], ["Moderate", "Got in the way of some things"], ["Severe", "Stopped me doing basic things"]] },
  { id: "focus", name: "Concentration", question: "How was your concentration today?", grades: [["Good", "Could focus when I needed to"], ["A bit off", "Drifted now and then"], ["Poor", "Hard to finish things"], ["Very poor", "Couldn't focus on much at all"]] },
  { id: "pelvic", name: "Period or pelvic pain", question: "Any period or pelvic pain today?", grades: [["None", "No pain"], ["Mild", "There, but not in the way"], ["Moderate", "Got in the way of some things"], ["Severe", "Stopped me doing basic things"]] },
];

// Conditions and the symptoms Mallow suggests for each (2 to 4, always editable).
export const conditions: { id: string; name: string; suggest: string[] }[] = [
  { id: "pain", name: "Chronic pain or fibromyalgia", suggest: ["pain", "sleep", "fatigue", "mood"] },
  { id: "arthritis", name: "Arthritis", suggest: ["pain", "stiffness", "sleep"] },
  { id: "anxiety", name: "Anxiety", suggest: ["anxiety", "sleep", "mood"] },
  { id: "insomnia", name: "Insomnia", suggest: ["sleep", "fatigue", "mood"] },
  { id: "ms", name: "MS or spasticity", suggest: ["spasm", "pain", "sleep"] },
  { id: "migraine", name: "Migraine", suggest: ["headache", "nausea", "sleep"] },
  { id: "endo", name: "Endometriosis", suggest: ["pelvic", "fatigue", "mood"] },
  { id: "adhd", name: "ADHD", suggest: ["focus", "sleep", "mood"] },
  { id: "nausea", name: "Nausea or appetite", suggest: ["nausea", "appetite"] },
  { id: "other", name: "Something else", suggest: [] },
];
export const symptomById = (id: string) => symptomCatalogue.find((s) => s.id === id)!;

export const reliefOptions = ["No help", "A little", "Quite a bit", "A lot"];
export const reliefPhrase = ["Didn't help", "Helped a little", "Helped quite a bit", "Helped a lot"];
export const sideEffects = ["Dry mouth", "Drowsy", "Dizzy", "Foggy", "Anxious", "Hungry"];

// ---- A day: the check-in (if done), the doses and anything noticed ----

// `slot` is set when the dose was ticked from the plan ("Bedtime"); as-needed doses have none.
export type Dose = { time: string; med: string; amount: number; relief?: number; slot?: string };
export type Day = { date: string; logged: boolean; grades: Record<string, number>; doses: Dose[]; side: string[]; note?: string };

// ---- Summaries ----

export function periodStats(days: Day[], tracked: string[]) {
  const logged = days.filter((d) => d.logged);
  const avg = (id: string) => {
    const v = logged.map((d) => d.grades[id]).filter((g) => g !== undefined);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
  };
  const doses = days.flatMap((d) => d.doses);
  const rated = doses.filter((d) => d.relief !== undefined);
  const sideCounts: Record<string, number> = {};
  for (const d of logged) for (const s of d.side) sideCounts[s] = (sideCounts[s] ?? 0) + 1;
  return {
    logged: logged.length,
    averages: Object.fromEntries(tracked.map((id) => [id, avg(id)])) as Record<string, number | undefined>,
    doses: doses.length,
    rated: rated.length,
    helped: rated.filter((d) => (d.relief ?? 0) >= 2).length,
    side: Object.entries(sideCounts).sort((a, b) => b[1] - a[1]),
    notes: logged.filter((d) => d.note).map((d) => ({ date: d.date, note: d.note! })),
  };
}

// Words for an average grade, and for a change between two periods (lower = easier for all).
export const gradeWord = (s: Symptom, avg?: number) => {
  if (avg === undefined) return "–";
  const low = Math.floor(avg);
  // Halfway between two grades (e.g. 9 mild days and 9 moderate), say both rather than round up.
  if (avg - low >= 0.4 && avg - low <= 0.6) return `${s.grades[low][0]} to ${s.grades[low + 1][0].toLowerCase()}`;
  return s.grades[Math.round(avg)][0];
};
export function trendWord(before?: number, now?: number) {
  if (before === undefined || now === undefined) return "Not enough yet";
  const d = now - before;
  if (d <= -0.5) return "Better";
  if (d <= -0.2) return "A little better";
  if (d < 0.2) return "About the same";
  if (d < 0.5) return "A little worse";
  return "Worse";
}
