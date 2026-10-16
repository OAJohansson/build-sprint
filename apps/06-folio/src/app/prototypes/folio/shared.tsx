"use client";

import { useState } from "react";

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

export type CoverBook = { id: string; title: string; author: string; isbn?: string | null; coverId?: number };

export function Stars({ rating, className = "" }: { rating?: number | null; className?: string }) {
  if (!rating) return null;
  return (
    <span className={`tracking-[0.04em] text-[var(--f-star)] ${className}`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 ? "½" : ""}
    </span>
  );
}

function hue(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function coverUrl(b: CoverBook) {
  if (b.coverId) return `https://covers.openlibrary.org/b/id/${b.coverId}-M.jpg`;
  if (b.isbn) return `https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg?default=false`;
  return null;
}

// Open Library cover; when there's none (or it 404s), a quiet typographic cover.
export function Cover({ book, tiny = false, className = "" }: { book: CoverBook; tiny?: boolean; className?: string }) {
  const url = coverUrl(book);
  const [failed, setFailed] = useState(!url);
  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-[3px] bg-[var(--f-raised)] shadow-[0_0_0_1px_var(--f-line)] ${className}`}
    >
      {failed || !url ? (
        <div
          className={`flex h-full flex-col p-[8%] text-left ${tiny ? "items-center justify-center" : "justify-between"}`}
          style={{ background: `oklch(0.3 0.03 ${hue(book.id)})` }}
        >
          {tiny ? (
            <span className="text-[13px] font-medium text-white/70">{book.title[0]}</span>
          ) : (
            <>
              <span className="line-clamp-4 text-[11px] font-medium leading-tight text-white/90">{book.title}</span>
              <span className="truncate text-[9px] text-white/60">{book.author}</span>
            </>
          )}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- prototype; covers come from Open Library
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      )}
    </div>
  );
}

export function SegmentTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div role="tablist" className="flex gap-5 text-[15px]">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap pb-1 transition-colors duration-150 ${
            value === o.value
              ? "text-[var(--f-text)] shadow-[inset_0_-1.5px_0_var(--f-text)]"
              : "text-[var(--f-faint)] hover:text-[var(--f-muted)]"
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 text-[var(--f-faint)] tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
