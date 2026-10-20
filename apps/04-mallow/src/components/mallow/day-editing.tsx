"use client";

import { useState } from "react";
import { amountLabel, long, nowTime, today, units, type Dose } from "@/lib/mallow/data";
import { dayOf, withDay, type Store } from "@/lib/mallow/store";
import { ChipRow, CompactGrades, Muted, Primary, ReliefRow, Sheet, SideEffectChips, toggleIn } from "./shared";

// Changing the record: a day's check-in, and adding, changing or deleting a dose, for any day up
// to today. Mistakes (a double tap, the wrong relief) must never be stuck in the doctor's summary.

type SetStore = (fn: (s: Store) => Store) => void;

export function CheckinSheet({
  open,
  store,
  setStore,
  date,
  onClose,
  onSaved,
}: {
  open: boolean;
  store: Store;
  setStore: SetStore;
  date: string;
  onClose: () => void;
  onSaved?: (firstTime: boolean) => void;
}) {
  const day = dayOf(store, date);
  const [grades, setGrades] = useState<Record<string, number>>(day.grades);
  const [side, setSide] = useState<string[]>(day.side);
  const [note, setNote] = useState(day.note ?? "");
  const missing = store.tracked.filter((id) => grades[id] === undefined).length;
  const isToday = date === today();

  const save = () => {
    setStore((s) => withDay(s, date, (d) => ({ ...d, logged: true, grades, side, note: note.trim() || undefined })));
    onSaved?.(!day.logged);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} label={isToday ? "How was today?" : `How was ${long(date)}?`}>
      <h2 className="serif mb-5 text-2xl">{isToday ? "How was today?" : `How was ${long(date)}?`}</h2>
      <div className="space-y-4">
        <CompactGrades tracked={store.tracked} grades={grades} onPick={(id, g) => setGrades((x) => ({ ...x, [id]: g }))} />
        <div>
          <p className="mb-2 text-sm font-medium">Anything else?</p>
          <SideEffectChips value={side} onToggle={(s) => setSide(toggleIn(side, s))} />
        </div>
        <div>
          <label htmlFor="day-note" className="mb-2 block text-sm font-medium">
            Anything your doctor should know? <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="day-note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="e.g. Flare after a long walk…"
            className="w-full resize-none rounded-xl border bg-white px-4 py-3"
            style={{ borderColor: "var(--line)" }}
          />
        </div>
      </div>
      <Primary className="mt-6" disabled={missing > 0} onClick={save}>
        {missing === 0 ? "Save" : `${missing} to go`}
      </Primary>
    </Sheet>
  );
}

// `index` set: change that dose. Not set: add a dose to the day.
export type DoseTarget = { date: string; index?: number };

export function DoseEditor({
  store,
  setStore,
  target,
  onClose,
}: {
  store: Store;
  setStore: SetStore;
  target: DoseTarget;
  onClose: () => void;
}) {
  const existing = target.index !== undefined ? dayOf(store, target.date).doses[target.index] : undefined;
  const first = store.meds[0];
  const [med, setMed] = useState(existing?.med ?? first?.id ?? "");
  const [amount, setAmount] = useState(existing?.amount ?? first?.amount ?? 1);
  const [time, setTime] = useState(existing?.time ?? (target.date === today() ? nowTime() : "12:00"));
  const [relief, setRelief] = useState<number | undefined>(existing?.relief);
  const m = store.meds.find((x) => x.id === med);
  const step = m ? units[m.form].step : 1;

  const write = (fn: (doses: Dose[]) => Dose[]) => {
    setStore((s) => withDay(s, target.date, (d) => ({ ...d, doses: fn(d.doses).sort((a, b) => a.time.localeCompare(b.time)) })));
    onClose();
  };
  const dose: Dose = { med, amount, time, ...(existing?.slot ? { slot: existing.slot } : {}), ...(relief !== undefined ? { relief } : {}) };

  return (
    <Sheet open onClose={onClose} label={existing ? "Change dose" : "Add a dose"}>
      <h2 className="serif text-2xl">{existing ? "Change dose" : "Add a dose"}</h2>
      <Muted className="mt-1">{target.date === today() ? "Today" : long(target.date)}</Muted>

      {store.meds.length > 1 && (
        <div className="mt-5">
          <ChipRow
            options={store.meds.map((x) => ({ id: x.id, label: x.name }))}
            value={med}
            onPick={(id) => {
              setMed(id);
              const picked = store.meds.find((x) => x.id === id);
              if (picked && !existing) setAmount(picked.amount);
            }}
          />
        </div>
      )}

      <div className="mt-5 flex items-center justify-between rounded-2xl border bg-white p-2" style={{ borderColor: "var(--line)" }}>
        <button
          aria-label="Less"
          onClick={() => setAmount((a) => Math.max(step, +(a - step).toFixed(2)))}
          className="press size-12 rounded-xl text-2xl"
          style={{ background: "var(--mallow-tint)", color: "var(--mallow-deep)" }}
        >
          −
        </button>
        <span className="tnum text-2xl font-medium">{m ? amountLabel(m, amount) : amount}</span>
        <button
          aria-label="More"
          onClick={() => setAmount((a) => +(a + step).toFixed(2))}
          className="press size-12 rounded-xl text-2xl"
          style={{ background: "var(--mallow-tint)", color: "var(--mallow-deep)" }}
        >
          +
        </button>
      </div>

      <label className="mt-3 flex items-center justify-between rounded-2xl border bg-white px-4 py-2" style={{ borderColor: "var(--line)" }}>
        <span className="font-medium">Time</span>
        <input type="time" name="time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} className="tnum min-h-10 bg-transparent text-right" />
      </label>

      <p className="mb-2 mt-5 text-sm font-medium">
        How much did it help? <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>(optional)</span>
      </p>
      <ReliefRow value={relief} onPick={(r) => setRelief(r === relief ? undefined : r)} />

      <Primary
        className="mt-6"
        disabled={!m}
        onClick={() =>
          write((doses) =>
            target.index !== undefined ? doses.map((d, i) => (i === target.index ? dose : d)) : [...doses, dose],
          )
        }
      >
        {existing ? "Save" : "Add dose"}
      </Primary>
      {existing && (
        <button
          onClick={() => window.confirm("Delete this dose?") && write((doses) => doses.filter((_, i) => i !== target.index))}
          className="press mt-2 min-h-11 w-full text-sm"
          style={{ color: "var(--ink-soft)" }}
        >
          Delete this dose
        </button>
      )}
    </Sheet>
  );
}
