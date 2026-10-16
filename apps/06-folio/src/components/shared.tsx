"use client";

import { Check } from "lucide-react";
import { useState } from "react";

export type CoverBook = { title: string; author: string; coverUrl: string | null; workKey?: string | null };

export function Stars({ rating, className = "" }: { rating?: number | null; className?: string }) {
  if (!rating) return null;
  return (
    <span className={`tracking-[0.04em] text-[var(--f-star)] ${className}`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 ? "½" : ""}
    </span>
  );
}

function hue(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

// The book's cover; when there's none (or it fails to load), a quiet tile with the title.
export function Cover({ book, tiny = false, className = "" }: { book: CoverBook; tiny?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : book.coverUrl;
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-[3px] bg-[var(--f-raised)] shadow-[0_0_0_1px_var(--f-line)] ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- covers come from Open Library; no image optimiser needed
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div
          className={`flex h-full flex-col text-left ${tiny ? "p-[3px]" : "justify-between p-[8%]"}`}
          style={{ background: `oklch(0.3 0.03 ${hue(book.workKey ?? book.title)})` }}
        >
          <span className={`font-medium text-white/85 ${tiny ? "line-clamp-4 text-[7px] leading-[1.15]" : "line-clamp-4 text-[11px] leading-tight"}`}>
            {book.title}
          </span>
          {!tiny && <span className="truncate text-[9px] text-white/60">{book.author}</span>}
        </div>
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
    <div role="tablist" className="flex min-w-0 gap-3.5 overflow-x-auto text-[14.5px] [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap pb-1 transition-colors duration-150 ${
            value === o.value ? "text-[var(--f-text)] shadow-[inset_0_-1.5px_0_var(--f-text)]" : "text-[var(--f-faint)] hover:text-[var(--f-muted)]"
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1 text-[13px] text-[var(--f-faint)] tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A bottom sheet over a dimmed page. Tapping outside closes it. */
export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={label}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 animate-in fade-in bg-black/50 duration-200" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[88dvh] max-w-xl animate-in slide-in-from-bottom overflow-y-auto overscroll-contain rounded-t-2xl bg-[var(--f-raised)] pb-[max(20px,env(safe-area-inset-bottom))] pt-3 duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-none">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--f-line)]" />
        {children}
      </div>
    </div>
  );
}

/** A sheet of single-choice options (genre filter, sort order). */
export function ChoiceSheet<T>({
  label,
  options,
  value,
  onChange,
  onClose,
}: {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  onClose: () => void;
}) {
  return (
    <Sheet label={label} onClose={onClose}>
      <ul>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <li key={o.label}>
              <button
                onClick={() => {
                  onChange(o.value);
                  onClose();
                }}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-[16px] transition-colors duration-150 active:bg-white/[0.04]"
              >
                <span className={active ? "font-medium" : ""}>{o.label}</span>
                {o.count !== undefined && <span className="text-[14px] text-[var(--f-faint)] tabular-nums">{o.count}</span>}
                {active && <Check size={18} className="ml-auto" aria-label="Selected" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/** A horizontal row of covers with titles; tap one to open it. */
export function CoverRow<T extends CoverBook>({
  title,
  items,
  wide = false,
  caption,
  onOpen,
  action,
}: {
  title: string;
  items: T[];
  wide?: boolean;
  caption?: (item: T) => React.ReactNode;
  onOpen: (item: T) => void;
  action?: React.ReactNode;
}) {
  if (!items.length) return null;
  return (
    <section>
      <div className="flex items-baseline justify-between px-4">
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <ul className="mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none]">
        {items.map((b, i) => (
          <li key={(b.workKey ?? b.title) + i} className={`shrink-0 snap-start ${wide ? "w-[132px]" : "w-[96px]"}`}>
            <button onClick={() => onOpen(b)} className="block w-full text-left transition-transform duration-150 ease-out active:scale-[0.97]">
              <Cover book={b} />
              <span className={`mt-1.5 line-clamp-2 leading-snug ${wide ? "text-[13px] font-medium" : "text-[12px]"}`}>{b.title}</span>
              <span className={`block truncate ${wide ? "text-[12px] text-[var(--f-muted)]" : "text-[11px] text-[var(--f-faint)]"}`}>{b.author}</span>
              {caption && <span className="mt-1 line-clamp-2 block text-[12px] leading-snug text-[var(--f-faint)]">{caption(b)}</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
