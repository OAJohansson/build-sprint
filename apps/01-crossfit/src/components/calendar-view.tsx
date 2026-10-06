"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { SectionLabel } from "@/components/ui/bits";
import { findMovement } from "@/lib/movements";
import { type Session, formatDate, formatEntry, today } from "@/lib/types";
import { cn } from "@/lib/utils";

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function CalendarView({ sessions, onDelete }: { sessions: Session[]; onDelete: (s: Session) => void }) {
  const now = today();
  const [month, setMonth] = useState(() => ({ y: +now.slice(0, 4), m: +now.slice(5, 7) - 1 }));
  const [selected, setSelected] = useState(now);

  const trained = new Map<string, number>();
  for (const s of sessions) trained.set(s.date, (trained.get(s.date) ?? 0) + 1);

  const first = new Date(month.y, month.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(month.y, month.m, i + 1))];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const monthCount = sessions.filter((s) => s.date.startsWith(iso(month.y, month.m, 1).slice(0, 7))).length;

  const shift = (d: number) =>
    setMonth(({ y, m }) => {
      const x = new Date(y, m + d, 1);
      return { y: x.getFullYear(), m: x.getMonth() };
    });
  const daySessions = sessions.filter((s) => s.date === selected);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[34px] font-bold uppercase tracking-wide">
          {first.toLocaleDateString("en-GB", { month: "long" })}
          {month.y !== +now.slice(0, 4) && <span className="text-muted-foreground"> {month.y}</span>}
        </h1>
        <div className="flex items-center">
          <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="flex size-11 items-center justify-center">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" aria-label="Next month" onClick={() => shift(1)} className="flex size-11 items-center justify-center">
            <ChevronRight className="size-6" />
          </button>
        </div>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{monthCount}</span> session{monthCount === 1 ? "" : "s"} this month
      </p>

      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_40px] items-center gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S", "WK"].map((h, i) => (
          <span key={i} className="text-center text-xs text-muted-foreground">{h}</span>
        ))}
        {weeks.map((week, w) => {
          const count = week.reduce((n, d) => n + (d ? trained.get(d) ?? 0 : 0), 0);
          return [
            ...week.map((d, i) =>
              d ? (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelected(d)}
                  aria-label={`${formatDate(d, { weekday: "long", day: "numeric", month: "long" })}${trained.has(d) ? ", trained" : ""}`}
                  aria-pressed={d === selected}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-[10px] text-sm font-semibold tabular-nums",
                    d === selected ? "bg-secondary text-secondary-foreground" : trained.has(d) ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                    d === now && d !== selected && !trained.has(d) && "ring-1 ring-input",
                  )}
                >
                  {+d.slice(8)}
                </button>
              ) : (
                <span key={`e${w}-${i}`} />
              ),
            ),
            <span key={`w${w}`} className="text-center font-display text-[17px] font-bold">
              {count ? `×${count}` : ""}
            </span>,
          ];
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <span className="font-display text-2xl font-bold uppercase">
          {formatDate(selected, { weekday: "short", day: "numeric", month: "short" })}
        </span>
        {daySessions.length === 0 && <p className="text-muted-foreground">Rest day.</p>}
        {daySessions.map((s) => (
          <div key={s.id} className="flex flex-col">
            <div className="flex items-center justify-between">
              <SectionLabel>{s.title}</SectionLabel>
              <button
                type="button"
                aria-label={`Delete ${s.title}`}
                onClick={() => confirm(`Delete "${s.title}"? PBs set in it go too.`) && onDelete(s)}
                className="-mr-2 flex size-10 items-center justify-center text-muted-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {s.entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 border-b border-border py-2.5">
                <span className="flex flex-col">
                  <span className="font-medium">{e.movement}</span>
                  <span className="text-xs text-muted-foreground">{e.note ?? findMovement(e.movement).category}</span>
                </span>
                <span className="text-right font-display text-xl font-bold tabular-nums">{formatEntry(e)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
