import { findMovement, type Category } from "@/lib/movements";
import { currentPbs, formatPb, repLabel } from "@/lib/pb";
import type { Pb, Session } from "@/lib/types";

export type MovementSummary = {
  name: string;
  category: Category;
  main: Pb; // the number shown on the board
  value: string; // main, formatted without the unit
  unit: string;
  tag: string;
  bests: Pb[]; // best per rep max / Rx-scaled
};

/** One row per movement with a PB: its headline number plus the other bests. */
export function summarize(pbs: Pb[]): MovementSummary[] {
  const groups = new Map<string, Pb[]>();
  for (const pb of currentPbs(pbs).values()) {
    const key = pb.movement.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), pb]);
  }
  return [...groups.values()].map((bests) => {
    bests.sort((a, b) => (a.repMax ?? 0) - (b.repMax ?? 0) || Number(b.rx) - Number(a.rx));
    const main = bests[0];
    const others = bests.slice(1).filter((b) => b.kind === "load").map((b) => `${repLabel(b.repMax)} ${b.value}`);
    const tag =
      main.kind === "load"
        ? [repLabel(main.repMax), ...others].join(" · ")
        : main.kind === "reps"
          ? "max reps"
          : main.rx
            ? "Rx"
            : "scaled";
    const formatted = formatPb(main);
    const [value, ...unit] = main.kind === "load" || main.kind === "reps" ? formatted.split(" ") : [formatted.replace(" rds", "")];
    return { name: main.movement, category: findMovement(main.movement).category, main, value, unit: unit.join(" "), tag, bests };
  });
}

/** Monday-first week containing `iso`, as YYYY-MM-DD strings. */
export function weekOf(iso: string): string[] {
  const d = new Date(`${iso}T12:00:00`);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  });
}

export const trainedDays = (sessions: Session[]) => new Set(sessions.map((s) => s.date));
