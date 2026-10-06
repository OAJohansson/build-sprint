"use client";

import { useState } from "react";
import { BigButton, Chip, Screen, SectionLabel, TopBar, inputClass } from "@/components/ui/bits";
import { MovementPicker } from "@/components/movement-picker";
import { findMovement } from "@/lib/movements";
import { parseRounds, parseTime } from "@/lib/pb";
import { type Pb, type PbKindStored, type Unit, today } from "@/lib/types";
import type { NewPbInput } from "@/lib/api";

const REP_MAXES = [1, 2, 3, 5, 10];

/** Record a PB by hand. Opens the movement picker first unless a movement is given. */
export function PbForm({
  movement: initial,
  unit: defaultUnit,
  pbs,
  onSave,
  onClose,
}: {
  movement?: string;
  unit: Unit;
  pbs: Pb[];
  onSave: (pb: NewPbInput) => Promise<void>;
  onClose: () => void;
}) {
  const [movement, setMovement] = useState(initial ?? "");
  const mv = findMovement(movement || "x");
  // Custom movements are treated as lifts.
  const kind: PbKindStored = mv.pb === "none" ? "load" : mv.pb;

  const [repMax, setRepMax] = useState(1);
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<Unit>(defaultUnit);
  const [reps, setReps] = useState("");
  const [time, setTime] = useState("");
  const [rounds, setRounds] = useState("");
  const [extra, setExtra] = useState("");
  const [rx, setRx] = useState(true);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!movement) {
    return <MovementPicker pbs={pbs} pbOnly onPick={setMovement} onClose={onClose} />;
  }

  const value =
    kind === "load" ? Number(weight) || null
    : kind === "reps" ? Number(reps) || null
    : kind === "time" ? parseTime(time)
    : parseRounds(`${rounds}+${extra || 0}`);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return setError(kind === "time" ? "Enter a time like 4:32." : "Enter a number.");
    setBusy(true);
    setError(null);
    try {
      await onSave({
        movement: mv.name,
        kind,
        repMax: kind === "load" ? repMax : null,
        value,
        unit: kind === "load" ? unit : null,
        rx: kind === "time" || kind === "rounds" ? rx : null,
        achievedOn: date,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Add PB" onBack={onClose} close />
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6">
        <button type="button" onClick={() => setMovement("")} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 text-left">
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">Movement</span>
            <span className="text-lg font-semibold">{mv.name}</span>
          </span>
          <span className="text-sm text-primary">Change</span>
        </button>

        {kind === "load" && (
          <>
            <div className="flex flex-col gap-2">
              <SectionLabel>Rep max</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {REP_MAXES.map((r) => (
                  <Chip key={r} active={repMax === r} onClick={() => setRepMax(r)}>
                    {r}RM
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-2">
                <SectionLabel>Weight</SectionLabel>
                <input autoFocus className={`${inputClass} font-display text-3xl font-bold`} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(",", "."))} />
              </label>
              <label className="flex w-24 flex-col gap-2">
                <SectionLabel>Unit</SectionLabel>
                <select className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                  <option>kg</option>
                  <option>lb</option>
                </select>
              </label>
            </div>
          </>
        )}

        {kind === "reps" && (
          <label className="flex flex-col gap-2">
            <SectionLabel>Max unbroken {mv.detail ?? "reps"}</SectionLabel>
            <input autoFocus className={`${inputClass} font-display text-3xl font-bold`} inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
          </label>
        )}

        {kind === "time" && (
          <label className="flex flex-col gap-2">
            <SectionLabel>Time (m:ss)</SectionLabel>
            <input autoFocus className={`${inputClass} font-display text-3xl font-bold`} placeholder="4:32" inputMode="text" value={time} onChange={(e) => setTime(e.target.value.replace(".", ":"))} />
          </label>
        )}

        {kind === "rounds" && (
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-2">
              <SectionLabel>Rounds</SectionLabel>
              <input autoFocus className={`${inputClass} font-display text-3xl font-bold`} inputMode="numeric" value={rounds} onChange={(e) => setRounds(e.target.value)} />
            </label>
            <label className="flex flex-1 flex-col gap-2">
              <SectionLabel>+ Reps</SectionLabel>
              <input className={`${inputClass} font-display text-3xl font-bold`} inputMode="numeric" value={extra} onChange={(e) => setExtra(e.target.value)} />
            </label>
          </div>
        )}

        {(kind === "time" || kind === "rounds") && (
          <div className="flex gap-2">
            <Chip active={rx} onClick={() => setRx(true)}>Rx</Chip>
            <Chip active={!rx} onClick={() => setRx(false)}>Scaled</Chip>
          </div>
        )}

        <label className="flex flex-col gap-2">
          <SectionLabel>When</SectionLabel>
          <input type="date" className={inputClass} value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex-1" />
        <BigButton type="submit" disabled={busy || !value}>
          {busy ? "Saving…" : "Save PB"}
        </BigButton>
      </form>
    </Screen>
  );
}
