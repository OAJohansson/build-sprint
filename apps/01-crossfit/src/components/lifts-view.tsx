"use client";

import { Trophy } from "lucide-react";
import { type Lift, type Session, formatDate, formatLift } from "@/lib/types";

type Entry = Lift & { date: string };

const toKg = (l: Pick<Lift, "weight" | "unit">) => (l.weight ?? 0) * (l.unit === "lb" ? 0.4536 : 1);

export function LiftsView({ sessions }: { sessions: Session[] }) {
  const byMovement = new Map<string, Entry[]>();
  for (const s of sessions) {
    for (const l of s.lifts) {
      const key = l.movement.toLowerCase();
      byMovement.set(key, [...(byMovement.get(key) ?? []), { ...l, date: s.date }]);
    }
  }

  const movements = [...byMovement.values()]
    .map((entries) => {
      entries.sort((a, b) => b.date.localeCompare(a.date));
      const best = entries.reduce((m, e) => (toKg(e) > toKg(m) ? e : m), entries[0]);
      return { name: entries[0].movement, entries, best, last: entries[0].date };
    })
    .sort((a, b) => b.last.localeCompare(a.last));

  if (!movements.length) {
    return <p className="py-12 text-center text-muted-foreground">Your movements and PRs will show up here.</p>;
  }

  return (
    <section className="flex flex-col gap-2">
      {movements.map((m) => (
        <details key={m.name} className="group rounded-lg border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <div>
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-xs text-muted-foreground">
                {m.entries.length} {m.entries.length === 1 ? "entry" : "entries"} · last {formatDate(m.last)}
              </p>
            </div>
            {m.best.weight != null && (
              <span className="flex items-center gap-1.5 text-lg font-semibold tabular-nums">
                <Trophy className="size-4 text-amber-500" />
                {m.best.weight} {m.best.unit}
              </span>
            )}
          </summary>
          <ul className="border-t px-4 py-2 text-sm">
            {m.entries.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 py-1">
                <span className="text-muted-foreground">{formatDate(e.date)}</span>
                <span className="text-right tabular-nums">
                  {formatLift(e)}
                  {e.id === m.best.id && e.weight != null && " 🏆"}
                  {e.note && <span className="block text-xs italic text-muted-foreground">{e.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}
