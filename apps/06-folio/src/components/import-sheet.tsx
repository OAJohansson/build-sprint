"use client";

import { useState } from "react";
import type { Api } from "@/lib/api";
import { fromGoodreads } from "@/lib/goodreads";
import type { Book } from "@/lib/types";
import { Sheet } from "./shared";

const BATCH = 25;

// Import a Goodreads export (My Books → Import and export → Export library), and back up
// everything as a file.
export function ImportSheet({ api, books, onDone, onClose }: { api: Api; books: Book[]; onDone: () => void; onClose: () => void }) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "running"; done: number; total: number }
    | { kind: "done"; added: number; merged: number; total: number; unmatched: { title: string; author: string }[] }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const run = async (file: File) => {
    try {
      const rows = fromGoodreads(await file.text());
      if (!rows.length) return setState({ kind: "error", message: "No read or want-to-read books in that file." });
      let added = 0;
      let merged = 0;
      const unmatched: { title: string; author: string }[] = [];
      for (let i = 0; i < rows.length; i += BATCH) {
        setState({ kind: "running", done: i, total: rows.length });
        const r = await api.importRows(rows.slice(i, i + BATCH));
        added += r.added;
        merged += r.merged;
        unmatched.push(...r.unmatched);
      }
      setState({ kind: "done", added, merged, total: rows.length, unmatched });
      onDone();
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "The import stopped." });
      onDone();
    }
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), books }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `folio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Sheet label="Import and export" onClose={state.kind === "running" ? () => {} : onClose}>
      <div className="space-y-5 px-5 pb-2">
        <section>
          <h2 className="text-[17px] font-semibold">Import from Goodreads</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-[var(--f-muted)]">
            On Goodreads: My Books → Import and export → Export library. Then choose the file here. Importing again adds nothing twice.
          </p>
          {state.kind === "running" ? (
            <p className="mt-3 text-[15px] tabular-nums" aria-live="polite">
              Importing {Math.min(state.done + BATCH, state.total)} of {state.total}…
            </p>
          ) : (
            <label className="mt-3 inline-block cursor-pointer rounded-full bg-[var(--f-text)] px-4 py-2.5 text-[15px] text-[var(--f-bg)]">
              Choose the CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) run(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          {state.kind === "done" && (
            <div className="mt-3 space-y-2 text-[15px] leading-relaxed" aria-live="polite">
              <p>
                All {state.total} books from the file are on your shelves
                {state.merged > 0 ? ` (${state.added} new; ${state.merged} were duplicates or already here, merged into one).` : "."}
              </p>
              {state.unmatched.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-[var(--f-muted)]">
                    {state.unmatched.length} weren&apos;t recognised by Open Library, so they have no cover or genre yet
                  </summary>
                  <ul className="mt-2 space-y-1 text-[14px] text-[var(--f-muted)]">
                    {state.unmatched.map((b, i) => (
                      <li key={i}>
                        {b.title} <span className="text-[var(--f-faint)]">· {b.author}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          {state.kind === "error" && (
            <p role="alert" className="mt-3 text-[15px] text-red-300">
              {state.message}
            </p>
          )}
        </section>
        <section className="border-t border-[var(--f-line)] pt-5">
          <h2 className="text-[17px] font-semibold">Back up</h2>
          <p className="mt-1 text-[14px] text-[var(--f-muted)]">Everything on your shelves as one file.</p>
          <button onClick={exportAll} disabled={!books.length} className="mt-3 rounded-full px-4 py-2.5 text-[15px] shadow-[0_0_0_1px_var(--f-line)] disabled:opacity-50">
            Export all ({books.length})
          </button>
        </section>
      </div>
    </Sheet>
  );
}
