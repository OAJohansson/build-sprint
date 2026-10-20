import { addDays, today } from "./data";

// "About when?" quick picks for dates the patient may not know exactly (when a medicine started,
// the last appointment). Rough is fine, and a skipped answer stays empty: Mallow never fills in a
// date by itself (owner, 20 Oct, user test finding 37).

export type Rough = "week" | "month" | "3months";
export const roughOptions: { id: Rough; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "About a month ago" },
  { id: "3months", label: "About 3 months ago" },
];

// The middle of each guess: 3, 30 or 91 days back (91 = the "3 months" range on Journey).
const back: Record<Rough, number> = { week: 3, month: 30, "3months": 91 };
export const roughDate = (r: Rough, now = today()) => addDays(now, -back[r]);

// Which quick pick a stored date came from, if any (so the chip shows as chosen).
export const roughOf = (date: string | undefined, now = today()) => roughOptions.find((o) => date === roughDate(o.id, now))?.id;
