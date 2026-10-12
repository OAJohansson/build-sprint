"use client";

import { useEffect } from "react";
import { reliefOptions, sideEffects, symptomById } from "@/lib/mallow/data";

// Small pieces the screens share.

export const toggleIn = (list: string[], s: string) =>
  list.includes(s) ? list.filter((x) => x !== s) : [...list, s];

// Four small bars filled up to the level: intensity without faces or traffic-light colours.
export function GradeMark({ level, on }: { level?: number; on?: boolean }) {
  return (
    <span className="flex shrink-0 items-end gap-0.5" aria-hidden>
      {[0, 1, 2, 3].map((b) => (
        <span
          key={b}
          className="w-1 rounded-full"
          style={{
            height: 6 + b * 3,
            background:
              level !== undefined && b <= level && level > 0
                ? on
                  ? "var(--mallow)"
                  : "var(--ink-faint)"
                : "var(--line)",
          }}
        />
      ))}
    </span>
  );
}

export function ReliefRow({ value, onPick }: { value?: number; onPick: (v: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="How much it helped">
      {reliefOptions.map((r, i) => {
        const on = value === i;
        return (
          <button
            key={r}
            role="radio"
            aria-checked={on}
            onClick={() => onPick(i)}
            className="press min-h-12 rounded-xl border px-1 text-sm font-medium leading-tight"
            style={{
              background: on ? "var(--mallow)" : "var(--card)",
              color: on ? "#fff" : "var(--ink)",
              borderColor: on ? "var(--mallow)" : "var(--line)",
            }}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

export function Chips({
  options,
  value,
  onToggle,
}: {
  options: string[];
  value: string[];
  onToggle: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((s) => {
        const on = value.includes(s);
        return (
          <button
            key={s}
            aria-pressed={on}
            onClick={() => onToggle(s)}
            className="press min-h-11 rounded-full border px-4 text-sm"
            style={{
              background: on ? "var(--mallow-tint)" : "var(--card)",
              borderColor: on ? "var(--mallow)" : "var(--line)",
              color: on ? "var(--mallow-deep)" : "var(--ink)",
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

export const SideEffectChips = (p: { value: string[]; onToggle: (s: string) => void }) => (
  <Chips options={sideEffects} {...p} />
);

// All tracked symptoms on one screen: four words per row, the meaning shown once picked.
export function CompactGrades({
  tracked,
  grades,
  onPick,
}: {
  tracked: string[];
  grades: Record<string, number>;
  onPick: (id: string, g: number) => void;
}) {
  return (
    <>
      {tracked.map(symptomById).map((s) => (
        <div key={s.id}>
          <p className="mb-2 text-sm font-medium">{s.question}</p>
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={s.name}>
            {s.grades.map(([word], g) => {
              const on = grades[s.id] === g;
              return (
                <button
                  key={word}
                  role="radio"
                  aria-checked={on}
                  onClick={() => onPick(s.id, g)}
                  className="press min-h-12 rounded-xl border px-1 text-[13px] leading-tight"
                  style={{
                    background: on ? "var(--mallow-tint)" : "var(--card)",
                    borderColor: on ? "var(--mallow)" : "var(--line)",
                    color: on ? "var(--mallow-deep)" : "var(--ink)",
                  }}
                >
                  {word}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 min-h-4 text-xs" style={{ color: "var(--ink-soft)" }}>
            {grades[s.id] !== undefined ? s.grades[grades[s.id]][1] : ""}
          </p>
        </div>
      ))}
    </>
  );
}

export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label={label}>
      <div className="scrim absolute inset-0 bg-black/25" onClick={onClose} />
      <div
        className="sheet absolute inset-x-0 bottom-0 mx-auto max-h-[88dvh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl px-5 pt-3"
        style={{ background: "var(--paper)", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: "var(--line)" }} />
        {children}
      </div>
    </div>
  );
}

export function Primary({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`press min-h-14 w-full rounded-2xl font-medium text-white disabled:opacity-40 ${className}`}
      style={{ background: "var(--mallow)" }}
    >
      {children}
    </button>
  );
}

export function Secondary({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`press min-h-12 w-full rounded-2xl border font-medium ${className}`}
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      {children}
    </button>
  );
}

export function Muted({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm ${className}`} style={{ color: "var(--ink-soft)" }}>
      {children}
    </p>
  );
}

export function Choice({
  on,
  onClick,
  children,
  sub,
}: {
  on?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="press min-h-14 w-full rounded-2xl border px-5 py-3 text-left"
      style={{ background: on ? "var(--mallow-tint)" : "var(--card)", borderColor: on ? "var(--mallow)" : "var(--line)" }}
    >
      <span className="block font-medium">{children}</span>
      {sub && (
        <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
          {sub}
        </span>
      )}
    </button>
  );
}
