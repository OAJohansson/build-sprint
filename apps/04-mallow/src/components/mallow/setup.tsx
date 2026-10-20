"use client";

import { useState } from "react";
import { amountLabel, conditions, symptomById, symptomCatalogue, today, type Medicine } from "@/lib/mallow/data";
import { newMedicine } from "@/lib/mallow/history";
import { MedicineFlow } from "./medicine";
import { Chips, Choice, CompactGrades, Muted, Primary, RoughDate, Secondary, toggleIn } from "./shared";
import type { Store } from "@/lib/mallow/store";

// First run: why Mallow exists, the condition (which suggests symptoms), how things were before
// treatment, the essentials of each medicine ("Anything else on your plan?"), the appointments.
// Then Today. Every step can be skipped, and no date is filled in for her (owner, 20 Oct).

export function Setup({ onDone, onDemo }: { onDone: (s: Store) => void; onDemo: () => void }) {
  const [step, setStep] = useState(0);
  const [condition, setCondition] = useState("");
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [tracked, setTracked] = useState<string[]>(["pain", "sleep"]);
  const [baseline, setBaseline] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(true);
  const [last, setLast] = useState<string>();
  const [next, setNext] = useState("");
  const [doctor, setDoctor] = useState("");

  // Summaries run from the last appointment. Skipped: from when her first medicine started (or
  // today), a real date she gave rather than a guessed appointment.
  // shortcut: Care then shows that date as "Last" appointment; give the store "no appointment yet" if it confuses people.
  const firstStart = meds.map((m) => m.startDate).sort()[0];
  const finish = () =>
    onDone({ version: 2, condition, baseline: pick(baseline, tracked), meds, tracked, doctor, past: [last ?? firstStart ?? today()], next, days: [] });
  const back = (to: number) => (
    <button onClick={() => setStep(to)} className="press -ml-1 min-h-11 self-start px-1 text-sm" style={{ color: "var(--ink-soft)" }}>
      ← Back
    </button>
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-5 pb-10 pt-[calc(env(safe-area-inset-top)+20px)]">
      {step === 0 && (
        <section className="enter flex flex-1 flex-col">
          <span className="serif text-xl" style={{ color: "var(--mallow-deep)" }}>
            Mallow
          </span>
          <h1 className="serif mt-auto text-[2.25rem] leading-tight">Between appointments, it&apos;s hard to remember how it&apos;s really been.</h1>
          <Muted className="mt-4 text-base leading-relaxed">
            Log your doses and how you feel, in a few taps. Over time you&apos;ll see how things change, and your doctor
            sees what really happened.
          </Muted>
          <Primary className="mt-10" onClick={() => setStep(1)}>
            Get started
          </Primary>
          <Muted className="mt-3 text-center text-xs">Everything stays on this phone.</Muted>
          <button onClick={onDemo} className="press mt-4 min-h-11 text-sm underline-offset-4 hover:underline" style={{ color: "var(--ink-soft)" }}>
            Look around with demo data first
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="enter flex flex-1 flex-col">
          {back(0)}
          <h1 className="serif mt-6 text-[1.75rem] leading-tight">What were you prescribed for?</h1>
          <Muted className="mt-2">So Mallow can suggest what to keep an eye on.</Muted>
          <div className="mt-6 flex flex-col gap-2">
            {conditions.map((c) => (
              <Choice
                key={c.id}
                on={condition === c.id}
                onClick={() => {
                  setCondition(c.id);
                  setTracked(c.suggest);
                  setTimeout(() => setStep(2), 180);
                }}
              >
                {c.name}
              </Choice>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="press mt-4 min-h-11 text-sm" style={{ color: "var(--ink-soft)" }}>
            Skip
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="enter flex flex-1 flex-col">
          {back(1)}
          <h1 className="serif mt-6 text-[1.75rem] leading-tight">What do you want to keep an eye on?</h1>
          <Muted className="mt-2">{condition && condition !== "other" ? "Suggested for you. " : ""}Up to four. You can change them later.</Muted>
          <div className="mt-6">
            <Chips
              options={symptomCatalogue.map((s) => s.name)}
              value={tracked.map((id) => symptomById(id).name)}
              onToggle={(name) => {
                const id = symptomCatalogue.find((s) => s.name === name)!.id;
                const nextList = toggleIn(tracked, id);
                if (nextList.length <= 4) setTracked(nextList);
              }}
            />
          </div>
          <Primary className="mt-auto" disabled={tracked.length === 0} onClick={() => setStep(3)}>
            {tracked.length === 0 ? "Pick at least one" : "Next"}
          </Primary>
        </section>
      )}

      {step === 3 && (
        <section className="enter flex flex-1 flex-col">
          {back(2)}
          <h1 className="serif mt-6 text-[1.75rem] leading-tight">Before you started treatment, how were things?</h1>
          <Muted className="mt-2">Your starting point, so you can see change from day one. Skip anything you don&apos;t remember.</Muted>
          <div className="mt-6 space-y-4">
            <CompactGrades
              tracked={tracked}
              grades={baseline}
              questions="before"
              onPick={(id, g) => setBaseline((b) => (b[id] === g ? omit(b, id) : { ...b, [id]: g }))}
            />
          </div>
          {/* Skipping stays possible but quiet: the starting point is what the graphs compare against. */}
          {Object.keys(pick(baseline, tracked)).length ? (
            <Primary className="mt-8" onClick={() => setStep(4)}>
              Next
            </Primary>
          ) : (
            <Secondary className="mt-8" onClick={() => setStep(4)}>
              Skip for now
            </Secondary>
          )}
        </section>
      )}

      {step === 4 && (adding || meds.length === 0) && (
        <div className="flex flex-1 flex-col">
          <MedicineFlow
            cancelLabel="← Back"
            onCancel={() => (meds.length ? setAdding(false) : setStep(3))}
            onSkip={meds.length ? undefined : () => setStep(5)}
            onSave={(fields, startDate) => {
              setMeds((m) => [...m, newMedicine(fields, startDate, `m${Date.now()}-${m.length}`)]);
              setAdding(false);
            }}
          />
        </div>
      )}

      {step === 4 && !adding && meds.length > 0 && (
        <section className="enter flex flex-1 flex-col">
          {back(3)}
          <h1 className="serif mt-6 text-[1.75rem] leading-tight">Anything else on your plan?</h1>
          <Muted className="mt-2">Like something for when you need it. You can add more later in Care.</Muted>
          <ul className="mt-6 divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
            {meds.map((m) => (
              <li key={m.id} className="px-4 py-3" style={{ borderColor: "var(--line)" }}>
                <span className="block break-words font-medium">{m.name}</span>
                <span className="tnum text-sm" style={{ color: "var(--ink-soft)" }}>
                  {amountLabel(m)} · {m.when.join(", ") || "No times yet"}
                </span>
              </li>
            ))}
          </ul>
          <Secondary className="mt-auto" onClick={() => setAdding(true)}>
            Add another
          </Secondary>
          <Primary className="mt-3" onClick={() => setStep(5)}>
            That&apos;s all
          </Primary>
        </section>
      )}

      {step === 5 && (
        <section className="enter flex flex-1 flex-col">
          {back(4)}
          <h1 className="serif mt-6 text-[1.75rem] leading-tight">When are your appointments?</h1>
          <Muted className="mt-2">Your summary covers everything since the last one.</Muted>
          <div className="mt-6">
            <RoughDate label="About when was your last one?" value={last} onChange={setLast} />
          </div>
          <div className="mt-6 divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
            <label className="flex min-h-14 items-center justify-between px-4" style={{ borderColor: "var(--line)" }}>
              <span className="font-medium">Next appointment</span>
              <input type="date" value={next} min={today()} onChange={(e) => setNext(e.target.value)} className="tnum min-h-10 bg-transparent text-right outline-none" />
            </label>
            <label className="flex min-h-14 items-center justify-between gap-4 px-4" style={{ borderColor: "var(--line)" }}>
              <span className="font-medium">Doctor</span>
              <input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Optional" autoComplete="off" className="min-h-10 min-w-0 flex-1 bg-transparent text-right outline-none" />
            </label>
          </div>
          <Muted className="mt-2 text-xs">Leave the next one empty if it isn&apos;t booked yet.</Muted>
          <Primary className="mt-auto" onClick={finish}>
            Start
          </Primary>
        </section>
      )}
    </main>
  );
}

const pick = (r: Record<string, number>, keys: string[]) => Object.fromEntries(Object.entries(r).filter(([k]) => keys.includes(k)));
const omit = (r: Record<string, number>, key: string) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== key));
