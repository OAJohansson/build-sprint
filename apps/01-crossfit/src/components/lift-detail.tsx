"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { BigButton, Chip, Screen, SectionLabel, TopBar } from "@/components/ui/bits";
import { findMovement } from "@/lib/movements";
import { currentPbs, formatPb, percentOf, repLabel } from "@/lib/pb";
import { type Pb, type Session, formatDate, formatEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const PCTS = [50, 60, 65, 70, 75, 80, 85, 90];

export function LiftDetail({
  movement,
  pbs,
  sessions,
  onBack,
  onUpdate,
  onDeletePb,
}: {
  movement: string;
  pbs: Pb[];
  sessions: Session[];
  onBack: () => void;
  onUpdate: () => void;
  onDeletePb: (pb: Pb) => void;
}) {
  const mv = findMovement(movement);
  const key = movement.toLowerCase();
  const mine = pbs.filter((p) => p.movement.toLowerCase() === key);
  const bests = [...currentPbs(mine).values()].sort(
    (a, b) => (a.repMax ?? 0) - (b.repMax ?? 0) || Number(b.rx) - Number(a.rx),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = bests.find((b) => b.id === selectedId) ?? bests[0];

  const history = [
    ...mine.map((p) => ({ date: p.achievedOn, text: `${repLabel(p.repMax) || (p.rx ? "Rx" : p.kind === "reps" ? "Max" : "Scaled")} ${formatPb(p)}`, pb: p, tag: p.sessionId ? "from a session" : "added" })),
    ...sessions.flatMap((s) =>
      s.entries
        .filter((e) => e.movement.toLowerCase() === key)
        .map((e) => ({ date: s.date, text: formatEntry(e), pb: null as Pb | null, tag: s.title })),
    ),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const tabLabel = (b: Pb) => (b.kind === "load" ? `${repLabel(b.repMax)} ${b.value}` : b.kind === "reps" ? "Max" : b.rx ? "Rx" : "Scaled");
  const [bigValue, ...bigUnit] = selected ? formatPb(selected).split(" ") : ["—"];

  return (
    <Screen>
      <TopBar title={mv.name} sub={mv.category === "Other" ? undefined : mv.detail ?? mv.category} onBack={onBack} />

      {selected ? (
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-[88px] font-bold leading-[0.9] text-primary tabular-nums">{bigValue}</span>
          <span className="text-xl font-semibold">{bigUnit.join(" ")}</span>
          <span className="ml-auto text-[13px] text-muted-foreground">set {formatDate(selected.achievedOn)}</span>
        </div>
      ) : (
        <p className="text-muted-foreground">No PB yet for this one.</p>
      )}

      {bests.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {bests.map((b) => (
            <Chip key={b.id} active={b.id === selected?.id} onClick={() => setSelectedId(b.id)}>
              {tabLabel(b)}
            </Chip>
          ))}
        </div>
      )}

      {selected?.kind === "load" && (
        <div className="flex flex-col gap-2.5">
          <SectionLabel>
            Percentages of {repLabel(selected.repMax)} · rounded to {selected.unit === "lb" ? "5 lb" : "2.5 kg"}
          </SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {PCTS.map((p) => (
              <div
                key={p}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-2.5",
                  p === 70 ? "bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                <span className={cn("text-xs", p === 70 ? "font-semibold" : "text-muted-foreground")}>{p}%</span>
                <span className="font-display text-[26px] font-bold tabular-nums">{percentOf(selected.value, selected.unit, p)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <SectionLabel>History</SectionLabel>
        {history.length === 0 && <p className="py-3 text-sm text-muted-foreground">Nothing logged yet.</p>}
        <ul className="mt-1">
          {history.map((h, i) => (
            <li key={i} className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-2 text-[15px]">
              <span className="text-muted-foreground">{formatDate(h.date)}</span>
              <span className="flex flex-1 flex-col items-end">
                <span>{h.text}</span>
                <span className="text-xs text-muted-foreground">{h.tag}</span>
              </span>
              {h.pb && (
                <button
                  type="button"
                  aria-label="Delete this PB record"
                  className="-mr-2 flex size-10 items-center justify-center text-muted-foreground"
                  onClick={() => confirm(`Delete PB ${formatPb(h.pb!)} from ${formatDate(h.pb!.achievedOn)}?`) && onDeletePb(h.pb!)}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {mv.pb !== "none" && (
        <BigButton variant="outline" onClick={onUpdate}>
          Add a PB for {mv.name}
        </BigButton>
      )}
    </Screen>
  );
}
