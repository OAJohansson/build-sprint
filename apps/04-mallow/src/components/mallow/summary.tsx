"use client";

import { amountLabel, daysBetween, gradeWord, long, periodStats, reliefOptions, short, symptomById, trendWord, type Day } from "@/lib/mallow/data";
import { amountOn } from "@/lib/mallow/history";
import { medsDuring } from "@/lib/mallow/trend";
import { Sheet } from "./shared";
import { chaptersOf, doctorName, type Store } from "@/lib/mallow/store";

// What the doctor will see: this stretch since the last appointment against the one before and
// against before treatment, and the medicines in use during it (with any amount changes).
export function SummarySheet({ store, open, onClose }: { store: Store; open: boolean; onClose: () => void }) {
  const chapters = chaptersOf(store);
  const now = chapters[chapters.length - 1];
  const before = chapters[chapters.length - 2];
  if (!now) return null;
  const a = periodStats(now.days, store.tracked);
  // No comparison from fewer than 3 check-ins in a stretch (the chart's rule too).
  const prev = before ? periodStats(before.days, store.tracked) : undefined;
  const b = prev && prev.logged >= 3 ? prev : undefined;
  const enough = a.logged >= 3;

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
              <div key={s.id} className="px-4 py-3" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="font-medium">{s.name}</dt>
                  {enough && b?.averages[s.id] !== undefined && a.averages[s.id] !== undefined && (
                    <dd className="whitespace-nowrap text-sm font-medium" style={{ color: "var(--mallow-deep)" }}>
                      {trendWord(b.averages[s.id], a.averages[s.id])}
                    </dd>
                  )}
                </div>
                <dd className="text-sm" style={{ color: "var(--ink-soft)" }}>
                  {fromTo(gradeWord(s, b?.averages[s.id]), gradeWord(s, a.averages[s.id]), b?.averages[s.id] !== undefined)}
                </dd>
                {enough && store.baseline[s.id] !== undefined && a.averages[s.id] !== undefined && (
                  <dd className="text-sm" style={{ color: "var(--ink-soft)" }}>
                    Before treatment: {s.grades[store.baseline[s.id]][0].toLowerCase()}. Now: {trendWord(store.baseline[s.id], a.averages[s.id]).toLowerCase()}.
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <h3 className="mt-5 text-sm font-medium">Medicines in this stretch</h3>
          <ul className="mt-2 space-y-2.5 text-sm">
            {medicineLines(store, now.from, now.to, now.days).map((line) => (
              <li key={line.id}>
                <span className="block break-words font-medium">{line.name}</span>
                {line.details.map((d) => (
                  <span key={d} className="tnum block" style={{ color: "var(--ink-soft)" }}>
                    {d}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          {a.side.length > 0 && (
            <p className="tnum mt-3 text-sm" style={{ color: "var(--ink-soft)" }}>
              {a.side.slice(0, 3).map(([s, n]) => `${s} on ${n} ${n === 1 ? "day" : "days"}`).join(" · ")}
            </p>
          )}
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

// What the clinician adjusts: each medicine in use during the stretch, the amount (and any change
// in it), when it started or stopped if that fell inside, and how often it was taken. How it helped
// is shown only when more than one medicine was taken (relief only tells them apart, owner 20 Oct).
function medicineLines(store: Store, from: string, to: string, days: Day[]) {
  const meds = medsDuring(store.meds, from, to);
  const taken = meds.filter((m) => days.some((d) => d.doses.some((x) => x.med === m.id)));
  return meds.map((m) => {
    const doses = days.flatMap((d) => d.doses.filter((x) => x.med === m.id));
    const onDays = days.filter((d) => d.doses.some((x) => x.med === m.id)).length;
    const changes = m.changes.slice(1).filter((c) => c.date > from && c.date <= to);
    const details: string[] = [];
    if (changes.length) {
      const start = amountLabel(m, amountOn(m, from));
      details.push(`${start} → ${changes.map((c) => `${amountLabel(m, c.amount)} from ${short(c.date)}`).join(" → ")}`);
    } else details.push(amountLabel(m, amountOn(m, to)));
    if (m.startDate > from) details.push(`Started ${short(m.startDate)}`);
    if (m.stopDate && m.stopDate <= to) details.push(`Stopped ${short(m.stopDate)}`);
    const asNeeded = !m.when.some((w) => w !== "When needed");
    if (asNeeded) details[0] = onDays ? `When needed · used on ${onDays} ${onDays === 1 ? "day" : "days"}` : "When needed · not used in this stretch";
    else details[0] += ` · ${doses.length} ${doses.length === 1 ? "dose" : "doses"} on ${onDays} ${onDays === 1 ? "day" : "days"}`;
    const rated = doses.filter((d) => d.relief !== undefined);
    if (taken.length > 1 && rated.length) {
      const helped = rated.filter((d) => (d.relief ?? 0) >= 2).length;
      details.push(`Helped “${reliefOptions[2].toLowerCase()}” or more: ${helped} of ${rated.length} rated`);
    }
    return { id: m.id, name: m.name, details };
  });
}
