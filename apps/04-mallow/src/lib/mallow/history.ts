import type { Medicine } from "./data";

// What was prescribed when. Each medicine keeps its start, its stop and every amount change, so
// graphs and summaries can show what was being taken on any day. Adding, changing and stopping a
// medicine in My plan go through these functions, so the history writes itself.

export type MedicineFields = Omit<Medicine, "id" | "startDate" | "stopDate" | "changes">;

export const newMedicine = (fields: MedicineFields, startDate: string, id = `m${Date.now()}`): Medicine => ({
  ...fields,
  id,
  startDate,
  changes: [{ date: startDate, amount: fields.amount }],
});

// Save edits from My plan. A new amount is recorded from `date` on; a second change on the same
// day replaces the first (fixing a typo shouldn't leave a marker on the graph).
// shortcut: an amount change always starts on the day it's entered, add a "changed on" date if
// patients update the app late.
export function updateMedicine(old: Medicine, fields: MedicineFields & { startDate?: string }, date: string): Medicine {
  const startDate = fields.startDate ?? old.startDate;
  let changes = old.changes.map((c) => (c.date === old.startDate ? { ...c, date: startDate } : c));
  if (fields.amount !== old.amount) {
    changes = date <= startDate
      ? [{ date: startDate, amount: fields.amount }]
      : [...changes.filter((c) => c.date !== date), { date, amount: fields.amount }];
  }
  return { ...old, ...fields, startDate, changes };
}

export const stopMedicine = (m: Medicine, date: string): Medicine => ({ ...m, stopDate: date });

export const activeOn = (m: Medicine, date: string) => m.startDate <= date && (!m.stopDate || date < m.stopDate);

export function amountOn(m: Medicine, date: string) {
  let amount = m.changes[0]?.amount ?? m.amount;
  for (const c of m.changes) if (c.date <= date) amount = c.amount;
  return amount;
}

// The day treatment started: the earliest start of any medicine.
export const treatmentStart = (meds: Medicine[]) =>
  meds.reduce<string | undefined>((min, m) => (!min || m.startDate < min ? m.startDate : min), undefined);
