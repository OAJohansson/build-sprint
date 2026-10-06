"use client";

import { useState } from "react";
import { HistoryView } from "@/components/history-view";
import { LiftsView } from "@/components/lifts-view";
import { LogView } from "@/components/log-view";
import { useLocalStorage } from "@/lib/use-local-storage";
import type { Session, Unit } from "@/lib/types";

const NO_SESSIONS: Session[] = [];
const TABS = [
  { id: "log", label: "Log" },
  { id: "history", label: "History" },
  { id: "lifts", label: "Progress" },
] as const;

export default function Home() {
  const [sessions, setSessions] = useLocalStorage("01-crossfit:sessions", NO_SESSIONS);
  const [unit, setUnit] = useLocalStorage<Unit>("01-crossfit:unit", "kg");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("log");

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const knownMovements = [...new Set(sessions.flatMap((s) => s.lifts.map((l) => l.movement)))].sort();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 p-4 pb-12 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">CrossFit Log</h1>
        <button
          type="button"
          className="rounded-md border px-2.5 py-1 text-sm tabular-nums text-muted-foreground"
          onClick={() => setUnit(unit === "kg" ? "lb" : "kg")}
          aria-label="Default unit"
        >
          {unit}
        </button>
      </header>

      <nav className="grid grid-cols-3 rounded-lg bg-muted p-1 text-sm font-medium">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md py-2 transition ${
              tab === t.id ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "log" && (
        <LogView
          unit={unit}
          knownMovements={knownMovements}
          onSave={(s) => {
            setSessions((prev) => [...prev, s]);
            setTab("history");
          }}
        />
      )}
      {tab === "history" && (
        <HistoryView
          sessions={sorted}
          onDelete={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
        />
      )}
      {tab === "lifts" && <LiftsView sessions={sorted} />}
    </main>
  );
}
