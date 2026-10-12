"use client";

import { useEffect } from "react";
import { doctor, nextAppointment, reliefOptions, sideEffects, summary, symptoms } from "./data";

// Pieces every direction needs. The directions differ in how they arrange them.

export function GradeList({
  grades,
  value,
  onPick,
}: {
  grades: [string, string][];
  value?: number;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup">
      {grades.map(([word, meaning], i) => {
        const on = value === i;
        return (
          <button
            key={word}
            role="radio"
            aria-checked={on}
            onClick={() => onPick(i)}
            className="press flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left"
            style={{
              background: on ? "var(--mallow-tint)" : "var(--card)",
              borderColor: on ? "var(--mallow)" : "var(--line)",
            }}
          >
            <span>
              <span className="block font-medium">{word}</span>
              <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
                {meaning}
              </span>
            </span>
            <GradeMark level={i} on={on} />
          </button>
        );
      })}
    </div>
  );
}

// Four small bars, filled up to the level: intensity without faces or traffic-light colours.
export function GradeMark({ level, on }: { level: number; on?: boolean }) {
  return (
    <span className="flex shrink-0 items-end gap-0.5" aria-hidden>
      {[0, 1, 2, 3].map((b) => (
        <span
          key={b}
          className="w-1 rounded-full"
          style={{
            height: 6 + b * 3,
            background:
              b <= level && level > 0 ? (on ? "var(--mallow)" : "var(--ink-faint)") : "var(--line)",
          }}
        />
      ))}
    </span>
  );
}

export function ReliefRow({ value, onPick }: { value?: string; onPick: (v: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="How much it helped">
      {reliefOptions.map((r) => {
        const on = value === r;
        return (
          <button
            key={r}
            role="radio"
            aria-checked={on}
            onClick={() => onPick(r)}
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

export function SideEffectChips({
  value,
  onToggle,
}: {
  value: string[];
  onToggle: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sideEffects.map((s) => {
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
        style={{ background: "var(--paper)", paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: "var(--line)" }} />
        {children}
      </div>
    </div>
  );
}

export function SummarySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="Summary for your appointment">
      <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
        For {doctor} · {nextAppointment}
      </p>
      <h2 className="serif mt-1 text-2xl">Since your last appointment</h2>
      <p className="tnum mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
        {summary.range}
      </p>
      <dl className="mt-5 divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
        {summary.rows.map((r) => (
          <div key={r.name} className="flex items-baseline justify-between gap-3 px-4 py-3" style={{ borderColor: "var(--line)" }}>
            <dt>
              <span className="block font-medium">{r.name}</span>
              <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
                {r.before} → {r.now}
              </span>
            </dt>
            <dd className="text-sm font-medium" style={{ color: "var(--mallow-deep)" }}>
              {r.trend}
            </dd>
          </div>
        ))}
      </dl>
      <ul className="tnum mt-4 space-y-1.5 text-sm" style={{ color: "var(--ink-soft)" }}>
        <li>{summary.doses}</li>
        <li>{summary.relief}</li>
        <li>{summary.side}</li>
      </ul>
      <p className="mt-5 text-xs" style={{ color: "var(--ink-faint)" }}>
        Preview: the full summary and its PDF come after this round.
      </p>
    </Sheet>
  );
}

export function toggleIn(list: string[], s: string) {
  return list.includes(s) ? list.filter((x) => x !== s) : [...list, s];
}

// All of Sam's symptoms on one screen: four words per row, the meaning shown once picked.
export function CompactGrades({
  grades,
  onPick,
}: {
  grades: Record<string, number>;
  onPick: (id: string, g: number) => void;
}) {
  return (
    <>
      {symptoms.map((s) => (
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
