"use client";

import { amountLabel, daysBetween, gradeWord, long, periodStats, reliefOptions, short, symptomById, trendWord } from "@/lib/mallow/data";
import { Sheet } from "./shared";
import { chaptersOf, doctorName, type Store } from "@/lib/mallow/store";

// What the doctor will see: this stretch since the last appointment against the one before.
export function SummarySheet({ store, open, onClose }: { store: Store; open: boolean; onClose: () => void }) {
  const chapters = chaptersOf(store);
  const now = chapters[chapters.length - 1];
  const before = chapters[chapters.length - 2];
  if (!now) return null;
  const a = periodStats(now.days, store.tracked);
  const b = before ? periodStats(before.days, store.tracked) : undefined;

  return (
    <Sheet open={open} onClose={onClose} label="Summary for your appointment">
      <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
        For {doctorName(store)}
        {store.next ? ` · ${long(store.next)}` : ""}
      </p>
      <h2 className="serif mt-1 text-2xl">Since your last appointment</h2>
      <p className="tnum mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
        {short(now.from)} – {short(now.to)} · {a.logged} of {daysBetween(now.from, now.to) + 1} days logged
      </p>
      {before && b && b.logged > 0 && (
        <p className="tnum text-sm" style={{ color: "var(--ink-soft)" }}>
          Compared with {short(before.from)} – {short(before.to)}
        </p>
      )}

      {a.logged === 0 ? (
        <p className="mt-6 text-sm" style={{ color: "var(--ink-soft)" }}>
          After a few days of logging, this is where your summary appears.
        </p>
      ) : (
        <>
          <dl className="mt-5 divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
            {store.tracked.map(symptomById).map((s) => (
              <div key={s.id} className="flex items-baseline justify-between gap-3 px-4 py-3" style={{ borderColor: "var(--line)" }}>
                <dt>
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
                    {fromTo(gradeWord(s, b?.averages[s.id]), gradeWord(s, a.averages[s.id]), b?.averages[s.id] !== undefined)}
                  </span>
                </dt>
                {b?.averages[s.id] !== undefined && a.averages[s.id] !== undefined && (
                  <dd className="text-sm font-medium" style={{ color: "var(--mallow-deep)" }}>
                    {trendWord(b.averages[s.id], a.averages[s.id])}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <ul className="mt-4 space-y-1.5 text-sm">
            {medicineLines(store, now.days).map((line) => (
              <li key={line.name} className="flex justify-between gap-3">
                <span className="min-w-0 truncate font-medium">{line.name}</span>
                <span className="tnum shrink-0" style={{ color: "var(--ink-soft)" }}>
                  {line.detail}
                </span>
              </li>
            ))}
          </ul>
          <ul className="tnum mt-3 space-y-1.5 text-sm" style={{ color: "var(--ink-soft)" }}>
            <li>
              {a.doses} doses · helped “{reliefOptions[2].toLowerCase()}” or more: {a.helped} of {a.rated} rated
            </li>
            {a.side.length > 0 && <li>{a.side.slice(0, 3).map(([s, n]) => `${s} on ${n} ${n === 1 ? "day" : "days"}`).join(" · ")}</li>}
          </ul>
          {a.notes.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm">
              {a.notes.map((n) => (
                <li key={n.date}>
                  <span className="tnum" style={{ color: "var(--ink-faint)" }}>
                    {short(n.date)}
                  </span>{" "}
                  {n.note}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Sheet>
  );
}

// "Poorly → a bit broken", or "Mostly moderate" when both periods round to the same word.
function fromTo(before: string, now: string, hasBefore: boolean) {
  if (!hasBefore || before === now) return `Mostly ${now.toLowerCase()}`;
  return `${before} → ${now.toLowerCase()}`;
}

// What the clinician adjusts: each medicine, its usual amount and how often it was used.
function medicineLines(store: Store, days: ReturnType<typeof chaptersOf>[number]["days"]) {
  return store.meds
    .map((m) => {
      const doses = days.flatMap((d) => d.doses.filter((x) => x.med === m.id));
      if (!doses.length) return undefined;
      const counts = new Map<number, number>();
      for (const d of doses) counts.set(d.amount, (counts.get(d.amount) ?? 0) + 1);
      const usual = [...counts].sort((x, y) => y[1] - x[1])[0][0];
      const onDays = days.filter((d) => d.doses.some((x) => x.med === m.id)).length;
      const n = doses.length;
      return { name: m.name, detail: `${amountLabel(m, usual)} · ${n} ${n === 1 ? "dose" : "doses"} on ${onDays} ${onDays === 1 ? "day" : "days"}` };
    })
    .filter((x): x is { name: string; detail: string } => !!x);
}
