"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { MovingUp, WeeklyGoal } from "@/components/progress";
import { Chip, SectionLabel, inputClass } from "@/components/ui/bits";
import { CATEGORIES, type Category } from "@/lib/movements";
import type { GoalChange } from "@/lib/progress";
import { summarize } from "@/lib/summary";
import type { Pb, Session } from "@/lib/types";

const SECTION: Record<Category, string> = {
  Olympic: "Olympic lifting",
  Strength: "Strength",
  Gymnastics: "Gymnastics",
  "KB & DB": "Kettlebell & dumbbell",
  Cardio: "Cardio",
  WODs: "Benchmark WODs",
  Other: "Other",
};

export function PbBoard({
  pbs,
  sessions,
  onOpen,
  onAddPb,
  goals,
  onGoalChange,
}: {
  pbs: Pb[];
  sessions: Session[];
  onOpen: (movement: string) => void;
  onAddPb: () => void;
  goals: GoalChange[];
  onGoalChange: (goals: GoalChange[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");

  const q = query.trim().toLowerCase();
  const rows = summarize(pbs)
    .filter((r) => (q ? r.name.toLowerCase().includes(q) : cat === "All" || r.category === cat))
    .sort((a, b) => a.name.localeCompare(b.name));
  const sections = [...CATEGORIES, "Other" as const]
    .map((c) => ({ c, rows: rows.filter((r) => r.category === c) }))
    .filter((s) => s.rows.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[34px] font-bold tracking-wide">MY TRAINING</h1>
        {pbs.length > 0 && (
          <button
            type="button"
            onClick={onAddPb}
            className="-mr-1 flex h-11 items-center gap-1.5 rounded-full border border-input px-4 text-sm font-semibold"
          >
            <Plus className="size-4" /> Add PB
          </button>
        )}
      </div>

      {sessions.length > 0 && (
        <>
          <WeeklyGoal sessions={sessions} goals={goals} onGoalChange={onGoalChange} />
          <MovingUp sessions={sessions} onOpen={onOpen} />
        </>
      )}

      {pbs.length > 0 && <SectionLabel>PBs</SectionLabel>}

      {pbs.length > 0 && (
        <>
          <label className="relative">
            <span className="sr-only">Find a lift or WOD</span>
            <Search className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-muted-foreground" />
            <input className={`${inputClass} pl-11`} placeholder="Find a lift or WOD" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {!q && (
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
              {(["All", ...CATEGORIES] as const).map((c) => (
                <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          )}
        </>
      )}

      {pbs.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-10 text-center">
          <p className="font-display text-2xl font-bold uppercase">Know your numbers</p>
          <p className="text-muted-foreground">
            Add the PBs you already know. Next time the coach says &ldquo;70% of your 1RM&rdquo;, you&rsquo;ll see the weight straight away.
          </p>
          <button type="button" onClick={onAddPb} className="h-12 rounded-xl bg-secondary px-6 font-semibold text-secondary-foreground">
            Add your first PB
          </button>
        </div>
      ) : sections.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Nothing matches &ldquo;{query}&rdquo;.</p>
      ) : (
        sections.map((s) => (
          <section key={s.c} className="flex flex-col">
            <h2 className="pb-1.5 text-xs uppercase tracking-[0.12em] text-muted-foreground">{SECTION[s.c]}</h2>
            {s.rows.map((r) => (
              <button
                key={r.name}
                type="button"
                onClick={() => onOpen(r.name)}
                className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-2.5 text-left"
              >
                <span className="text-[17px] font-medium">{r.name}</span>
                <span className="flex items-baseline gap-2.5">
                  <span className="text-xs text-muted-foreground">{r.tag}</span>
                  <span className="font-display text-[26px] font-bold tabular-nums">{r.value}</span>
                  {r.unit && <span className="-ml-1.5 text-sm text-muted-foreground">{r.unit}</span>}
                </span>
              </button>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
