"use client";

import { useState } from "react";
import { amountLabel, doctor, symptomCatalogue, type Medicine } from "./data";
import { MedicineScreen } from "./medicine";
import { Chips, Muted, Secondary, toggleIn } from "./shared";
import { lastOf, type Store } from "./store";

// Care: what Sam takes, what Sam tracks, and when the appointments are.

export function Care({
  store,
  setStore,
  onLoadDemo,
  onStartFresh,
  addingMedicine,
  setAddingMedicine,
}: {
  store: Store;
  setStore: (fn: (s: Store) => Store) => void;
  onLoadDemo: () => void;
  onStartFresh: () => void;
  addingMedicine: boolean;
  setAddingMedicine: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState<Medicine>();
  const last = lastOf(store);

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 pb-36 pt-[calc(env(safe-area-inset-top)+var(--top-gap))]">
      <h1 className="serif text-[2rem] leading-tight">Care</h1>

      <Section title="Your medicine">
        <ul className="divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
          {store.meds.map((m) => (
            <li key={m.id} style={{ borderColor: "var(--line)" }}>
              <button onClick={() => setEditing(m)} className="press flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left">
                <span>
                  <span className="block font-medium">{m.name}</span>
                  <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
                    {[m.form, m.strength, `${amountLabel(m)} usually`, m.when.join(", ").toLowerCase()].filter(Boolean).join(" · ")}
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

      <Section title={`Appointments with ${doctor}`}>
        <div className="divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
          <DateRow
            label="Last"
            value={last}
            onChange={(v) => setStore((s) => ({ ...s, past: [...s.past.slice(0, -1), v] }))}
          />
          <DateRow label="Next" value={store.next} onChange={(v) => setStore((s) => ({ ...s, next: v }))} />
        </div>
      </Section>

      <Section title="Prototype">
        <div className="flex flex-col gap-2">
          <Secondary onClick={onLoadDemo}>Load Sam&apos;s demo history</Secondary>
          <Secondary onClick={onStartFresh}>Start fresh (first-run setup)</Secondary>
        </div>
      </Section>

      {(addingMedicine || editing) && (
        <MedicineScreen
          initial={editing}
          onCancel={() => {
            setEditing(undefined);
            setAddingMedicine(false);
          }}
          onRemove={
            editing && store.meds.length > 1
              ? () => {
                  setStore((s) => ({ ...s, meds: s.meds.filter((x) => x.id !== editing.id) }));
                  setEditing(undefined);
                }
              : undefined
          }
          onSave={(m) => {
            setStore((s) => ({
              ...s,
              meds: s.meds.some((x) => x.id === m.id) ? s.meds.map((x) => (x.id === m.id ? m : x)) : [...s.meds, m],
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
