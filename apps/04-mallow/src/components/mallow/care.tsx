"use client";

import { useState } from "react";
import { amountLabel, short, symptomById, symptomCatalogue, today, type Medicine } from "@/lib/mallow/data";
import { newMedicine, stopMedicine, updateMedicine } from "@/lib/mallow/history";
import { MedicineScreen } from "./medicine";
import { Chips, CompactGrades, Muted, Primary, Secondary, Sheet, toggleIn } from "./shared";
import { lastOf, type Store } from "@/lib/mallow/store";
import { personas, type Persona } from "@/lib/mallow/demo";

// Care: my plan (what I take, as prescribed, with its history), what I track and how it was
// before treatment, and when the appointments are.

export function Care({
  store,
  setStore,
  demo,
  persona,
  onStartDemo,
  onLeaveDemo,
  onErase,
  addingMedicine,
  setAddingMedicine,
}: {
  store: Store;
  setStore: (fn: (s: Store) => Store) => void;
  demo: boolean;
  persona: Persona;
  onStartDemo: (who?: Persona) => void;
  onLeaveDemo: () => void;
  onErase: () => void;
  addingMedicine: boolean;
  setAddingMedicine: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<Medicine>();
  const [baselineOpen, setBaselineOpen] = useState(false);
  const last = lastOf(store);
  const current = store.meds.filter((m) => !m.stopDate || m.stopDate > today());
  const stopped = store.meds.filter((m) => m.stopDate && m.stopDate <= today());

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+20px)]">
      <h1 className="serif text-[2rem] leading-tight">Care</h1>

      <Section title="My plan" hint="As your doctor prescribed. When it changes, update it here and Mallow remembers what you took and when.">
        <ul className="divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
          {current.map((m) => (
            <li key={m.id} style={{ borderColor: "var(--line)" }}>
              <button onClick={() => setEditing(m)} className="press flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left">
                <span className="min-w-0">
                  <span className="block break-words font-medium">{m.name}</span>
                  <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
                    {[m.form, m.strength, amountLabel(m), m.when.join(", ").toLowerCase()].filter(Boolean).join(" · ")}
                  </span>
                  {(m.howTo || m.asNeeded) && (
                    <span className="block break-words text-sm" style={{ color: "var(--ink-soft)" }}>
                      {[m.howTo, m.asNeeded].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <span className="block text-xs" style={{ color: "var(--ink-faint)" }}>
                    Since {short(m.startDate)}
                    {m.changes.length > 1 ? ` · changed ${short(m.changes.at(-1)!.date)}` : ""}
                    {m.stopDate ? ` · stops ${short(m.stopDate)}` : ""}
                  </span>
                </span>
                <span aria-hidden style={{ color: "var(--ink-faint)" }}>
                  ›
                </span>
              </button>
            </li>
          ))}
          <li style={{ borderColor: "var(--line)" }}>
            <button
              onClick={() => setAddingMedicine(true)}
              className="press min-h-14 w-full px-4 text-left font-medium"
              style={{ color: "var(--mallow-deep)" }}
            >
              + Add a medicine
            </button>
          </li>
        </ul>
        {stopped.length > 0 && (
          <Muted className="mt-3">
            Stopped: {stopped.map((m) => `${m.name} (${short(m.startDate)} to ${short(m.stopDate!)})`).join(", ")}
          </Muted>
        )}
      </Section>

      <Section title="What you track" hint="Up to four, so a check-in stays quick.">
        <Chips
          options={symptomCatalogue.map((s) => s.name)}
          value={store.tracked.map((id) => symptomCatalogue.find((s) => s.id === id)!.name)}
          onToggle={(name) => {
            const id = symptomCatalogue.find((s) => s.name === name)!.id;
            setStore((s) => {
              const next = toggleIn(s.tracked, id);
              return next.length === 0 || next.length > 4 ? s : { ...s, tracked: next };
            });
          }}
        />
      </Section>

      <Section title="Before treatment" hint="How things were before you started. Your starting point in graphs and the summary.">
        <button
          onClick={() => setBaselineOpen(true)}
          className="press w-full divide-y rounded-2xl border bg-white text-left"
          style={{ borderColor: "var(--line)" }}
          aria-label="Change how things were before treatment"
        >
          {store.tracked.map(symptomById).map((sym) => (
            <span key={sym.id} className="flex min-h-12 items-center justify-between gap-3 px-4" style={{ borderColor: "var(--line)" }}>
              <span className="font-medium">{sym.name}</span>
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                {store.baseline[sym.id] !== undefined ? sym.grades[store.baseline[sym.id]][0] : "Not set"} ›
              </span>
            </span>
          ))}
        </button>
      </Section>

      <Section title="Appointments">
        <div className="divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
          <label className="flex min-h-14 items-center justify-between gap-4 px-4" style={{ borderColor: "var(--line)" }}>
            <span className="font-medium">Doctor</span>
            <input
              value={store.doctor}
              onChange={(e) => setStore((s) => ({ ...s, doctor: e.target.value }))}
              placeholder="Optional"
              autoComplete="off"
              className="min-h-10 min-w-0 flex-1 bg-transparent text-right outline-none"
            />
          </label>
          <DateRow
            label="Last"
            value={last}
            onChange={(v) => setStore((s) => ({ ...s, past: [...s.past.slice(0, -1), v] }))}
          />
          <DateRow label="Next" value={store.next} onChange={(v) => setStore((s) => ({ ...s, next: v }))} />
        </div>
      </Section>

      <Section title="Your data" hint="Everything stays on this phone. Nothing is sent anywhere.">
        <div className="flex flex-col gap-2">
          {/* Two demo patients; switching rebuilds the demo, never touching real data. */}
          <div className="grid grid-cols-2 gap-2">
            {personas.map((p) => {
              const on = demo && persona === p.id;
              return (
                <button
                  key={p.id}
                  aria-pressed={on}
                  onClick={() => onStartDemo(p.id)}
                  className="press min-h-14 rounded-2xl border px-3 py-2 text-left"
                  style={{ background: on ? "var(--mallow-tint)" : "var(--card)", borderColor: on ? "var(--mallow)" : "var(--line)" }}
                >
                  <span className="block text-sm font-medium">Demo: {p.name}</span>
                  <span className="block text-xs" style={{ color: "var(--ink-soft)" }}>
                    {p.sub}
                  </span>
                </button>
              );
            })}
          </div>
          {demo && <Secondary onClick={onLeaveDemo}>Leave the demo</Secondary>}
          {!demo && (
            <Secondary
              onClick={() => {
                if (window.confirm("Delete everything you've logged on this phone? This can't be undone.")) onErase();
              }}
            >
              Delete my data
            </Secondary>
          )}
        </div>
      </Section>

      <Sheet open={baselineOpen} onClose={() => setBaselineOpen(false)} label="Before treatment">
        <h2 className="serif text-2xl">Before you started treatment</h2>
        <Muted className="mt-1">Tap a word again to clear it.</Muted>
        <div className="mt-5 space-y-4">
          <CompactGrades
            tracked={store.tracked}
            grades={store.baseline}
            questions="before"
            onPick={(id, g) =>
              setStore((s) => {
                const baseline = { ...s.baseline };
                if (baseline[id] === g) delete baseline[id];
                else baseline[id] = g;
                return { ...s, baseline };
              })
            }
          />
        </div>
        <Primary className="mt-6" onClick={() => setBaselineOpen(false)}>
          Done
        </Primary>
      </Sheet>

      {(addingMedicine || editing) && (
        <MedicineScreen
          full
          initial={editing}
          onCancel={() => {
            setEditing(undefined);
            setAddingMedicine(false);
          }}
          onStop={
            editing
              ? () => {
                  if (!window.confirm(`Stop ${editing.name} from today? Mallow keeps what you took before.`)) return;
                  // Added today by mistake and never taken: remove it rather than keep a one-day history.
                  const neverTaken = editing.startDate >= today() && !store.days.some((d) => d.doses.some((x) => x.med === editing.id));
                  setStore((s) => ({
                    ...s,
                    meds: neverTaken ? s.meds.filter((x) => x.id !== editing.id) : s.meds.map((x) => (x.id === editing.id ? stopMedicine(x, today()) : x)),
                  }));
                  setEditing(undefined);
                }
              : undefined
          }
          onSave={(fields, startDate) => {
            setStore((s) => ({
              ...s,
              meds: editing
                ? s.meds.map((x) => (x.id === editing.id ? updateMedicine(x, { ...fields, startDate }, today()) : x))
                : [...s.meds, newMedicine(fields, startDate)],
            }));
            setEditing(undefined);
            setAddingMedicine(false);
          }}
        />
      )}
    </main>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-medium">{title}</h2>
      {hint && <Muted className="mb-3 mt-0.5">{hint}</Muted>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function DateRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex min-h-14 items-center justify-between px-4" style={{ borderColor: "var(--line)" }}>
      <span className="font-medium">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="tnum min-h-10 bg-transparent text-right outline-none"
      />
    </label>
  );
}
