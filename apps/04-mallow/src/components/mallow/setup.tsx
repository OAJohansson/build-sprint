"use client";

import { useState } from "react";
import { addDays, symptomCatalogue, today, type Medicine } from "@/lib/mallow/data";
import { MedicineFlow } from "./medicine";
import { Chips, Muted, Primary, toggleIn } from "./shared";
import type { Store } from "@/lib/mallow/store";

// First run: why Mallow exists, the medicine, what to track, the appointments. Then Today.

export function Setup({ onDone, onDemo }: { onDone: (s: Store) => void; onDemo: () => void }) {
  const [step, setStep] = useState(0);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [tracked, setTracked] = useState<string[]>(["pain", "sleep"]);
  const [last, setLast] = useState(() => addDays(today(), -28));
  const [next, setNext] = useState("");
  const [doctor, setDoctor] = useState("");

  const finish = () => onDone({ meds, tracked, doctor, past: [last], next, days: [] });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-5 pb-10 pt-[calc(env(safe-area-inset-top)+20px)]">
      {step === 0 && (
        <section className="enter flex flex-1 flex-col">
          <span className="serif text-xl" style={{ color: "var(--mallow-deep)" }}>
            Mallow
          </span>
          <h1 className="serif mt-auto text-[2.25rem] leading-tight">Between appointments, it&apos;s hard to remember how it&apos;s really been.</h1>
          <Muted className="mt-4 text-base leading-relaxed">
            Log your doses and how you feel, in a few taps. When you see your doctor, they see what really happened, and can
            adjust your care with you.
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
        <div className="flex flex-1 flex-col">
          {meds.length === 0 ? (
            <MedicineFlow cancelLabel="← Back" onCancel={() => setStep(0)} onSave={(m) => setMeds([m])} />
          ) : (
            <section className="enter flex flex-1 flex-col">
              <h1 className="serif text-[1.75rem] leading-tight">Do you take anything else?</h1>
              <Muted className="mt-2">For example, an oil every day and flower for flare-ups.</Muted>
              <ul className="mt-6 space-y-2">
                {meds.map((m) => (
                  <li key={m.id} className="rounded-2xl border bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                      {" "}
                      · {m.form}
                    </span>
                  </li>
                ))}
              </ul>
              <Primary className="mt-auto" onClick={() => setStep(2)}>
                That&apos;s everything
              </Primary>
              <button
                onClick={() => setStep(1.5)}
                className="press mt-2 min-h-12 w-full text-sm font-medium"
                style={{ color: "var(--mallow-deep)" }}
              >
                + Add another
              </button>
            </section>
          )}
        </div>
      )}

      {step === 1.5 && (
        <MedicineFlow
          onCancel={() => setStep(1)}
          onSave={(m) => {
            setMeds((x) => [...x, m]);
            setStep(1);
          }}
        />
      )}

      {step === 2 && (
        <section className="enter flex flex-1 flex-col">
          <button onClick={() => setStep(1)} className="press -ml-1 min-h-11 self-start px-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            ← Back
          </button>
          <h1 className="serif mt-6 text-[1.75rem] leading-tight">What do you want to keep an eye on?</h1>
          <Muted className="mt-2">Pick up to four. You can change them later.</Muted>
          <div className="mt-6">
            <Chips
              options={symptomCatalogue.map((s) => s.name)}
              value={tracked.map((id) => symptomCatalogue.find((s) => s.id === id)!.name)}
              onToggle={(name) => {
                const id = symptomCatalogue.find((s) => s.name === name)!.id;
                const nextList = toggleIn(tracked, id);
                if (nextList.length <= 4) setTracked(nextList);
              }}
            />
          </div>
          <Primary className="mt-auto" disabled={tracked.length === 0} onClick={() => setStep(3)}>
            Next
          </Primary>
        </section>
      )}

      {step === 3 && (
        <section className="enter flex flex-1 flex-col">
          <button onClick={() => setStep(2)} className="press -ml-1 min-h-11 self-start px-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            ← Back
          </button>
          <h1 className="serif mt-6 text-[1.75rem] leading-tight">When are your appointments?</h1>
          <Muted className="mt-2">Your summary covers everything since the last one.</Muted>
          <div className="mt-6 divide-y rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
            <label className="flex min-h-14 items-center justify-between px-4" style={{ borderColor: "var(--line)" }}>
              <span className="font-medium">Last appointment</span>
              <input type="date" value={last} max={today()} onChange={(e) => e.target.value && setLast(e.target.value)} className="tnum min-h-10 bg-transparent text-right outline-none" />
            </label>
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
