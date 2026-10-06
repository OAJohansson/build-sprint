"use client";

import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Session, formatDate, formatLift } from "@/lib/types";

export function HistoryView({
  sessions,
  onDelete,
}: {
  sessions: Session[];
  onDelete: (id: string) => void;
}) {
  if (!sessions.length) {
    return <p className="py-12 text-center text-muted-foreground">No sessions yet. Log your first one.</p>;
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `crossfit-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="flex flex-col gap-3">
      {sessions.map((s) => (
        <article key={s.id} className="rounded-lg border p-4">
          <header className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{formatDate(s.date)}</p>
              <h3 className="font-semibold">{s.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete session"
              onClick={() => confirm(`Delete "${s.title}"?`) && onDelete(s.id)}
            >
              <Trash2 />
            </Button>
          </header>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {s.lifts.map((l) => (
              <li key={l.id} className="flex justify-between gap-3">
                <span>{l.movement}</span>
                <span className="text-right tabular-nums text-muted-foreground">
                  {formatLift(l)}
                  {l.note && <span className="block text-xs italic">{l.note}</span>}
                </span>
              </li>
            ))}
          </ul>
          {s.transcript && (
            <details className="mt-2 text-sm text-muted-foreground">
              <summary className="cursor-pointer text-xs">Original note</summary>
              <p className="mt-1 whitespace-pre-wrap">{s.transcript}</p>
            </details>
          )}
        </article>
      ))}
      <Button variant="ghost" size="sm" className="self-center text-muted-foreground" onClick={exportJson}>
        <Download /> Export as JSON
      </Button>
    </section>
  );
}
