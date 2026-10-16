"use client";

import { useState } from "react";
import type { Book } from "./data";

// Folio's prototype palette: warm ink, off-white type, one amber accent for stars.
export const folio = {
  "--f-bg": "oklch(0.17 0.006 60)",
  "--f-raised": "oklch(0.215 0.007 60)",
  "--f-line": "oklch(1 0 0 / 0.08)",
  "--f-text": "oklch(0.95 0.01 85)",
  "--f-muted": "oklch(0.7 0.012 80)",
  "--f-faint": "oklch(0.55 0.01 80)",
  "--f-star": "oklch(0.82 0.13 78)",
} as React.CSSProperties;

export function Stars({ rating, className = "" }: { rating?: number | null; className?: string }) {
  if (!rating) return null;
  const whole = Math.floor(rating);
  return (
    <span
      className={`tracking-[0.04em] text-[var(--f-star)] ${className}`}
      aria-label={`${rating} out of 5 stars`}
    >
      {"★".repeat(whole)}
      {rating % 1 ? "½" : ""}
    </span>
  );
}

function hue(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

// Open Library cover by ISBN; when there's none (or it 404s), a quiet typographic cover.
export function Cover({ book, tiny = false, className = "" }: { book: Book; tiny?: boolean; className?: string }) {
  const [failed, setFailed] = useState(!book.isbn);
  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-[3px] bg-[var(--f-raised)] shadow-[0_0_0_1px_var(--f-line)] ${className}`}
    >
      {failed ? (
        <div
          className="flex h-full flex-col justify-between p-[8%] text-left"
          style={{ background: `oklch(0.32 0.05 ${hue(book.id)})` }}
        >
          {!tiny && (
            <>
              <span className="line-clamp-4 text-[11px] font-medium leading-tight text-white/90">
                {book.title}
              </span>
              <span className="truncate text-[9px] text-white/60">{book.author}</span>
            </>
          )}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- prototype; covers come from Open Library
        <img
          src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

export function ShelfTabs({
  shelf,
  onChange,
  counts,
}: {
  shelf: "read" | "want";
  onChange: (s: "read" | "want") => void;
  counts: { read: number; want: number };
}) {
  return (
    <div role="tablist" className="flex gap-5 text-[15px]">
      {(["read", "want"] as const).map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={shelf === s}
          onClick={() => onChange(s)}
          className={`pb-1 transition-colors duration-150 ${
            shelf === s
              ? "text-[var(--f-text)] shadow-[inset_0_-1.5px_0_var(--f-text)]"
              : "text-[var(--f-faint)] hover:text-[var(--f-muted)]"
          }`}
        >
          {s === "read" ? "Read" : "Want to read"}
          <span className="ml-1.5 text-[var(--f-faint)] tabular-nums">{counts[s]}</span>
        </button>
      ))}
    </div>
  );
}

export function monthLabel(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
